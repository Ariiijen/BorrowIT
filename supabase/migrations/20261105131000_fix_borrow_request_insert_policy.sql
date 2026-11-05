-- Allow a Firebase-authenticated borrower to insert a pending request
-- while preserving lender ownership validation.

create or replace function public.firebase_uid()
returns text
language sql
stable
security definer
set search_path = public
as $$ select nullif(auth.jwt() ->> 'sub', ''); $$;

grant execute on function public.firebase_uid() to authenticated;

drop policy if exists "borrowers_can_create_pending_requests" on public.borrowing_requests;
drop policy if exists "borrowers can create pending requests" on public.borrowing_requests;

create policy "borrowers_can_create_pending_requests"
  on public.borrowing_requests
  for insert
  to authenticated
  with check (
    public.firebase_uid() is not null
    and borrower_id = public.firebase_uid()
    and status = 'Pending'
    and lender_id is not null
    and exists (
      select 1
      from public.equipment e
      where e.id = equipment_id
        and e.owner_id = lender_id
        and e.owner_id <> public.firebase_uid()
        and e.status = 'Available'
    )
  );

grant insert on public.borrowing_requests to authenticated;

-- New Firebase users, especially Google sign-ins, can arrive before an
-- activation custom claim assigns the Postgres "authenticated" role.
-- Allow profile bootstrap through the "anon" role, but scope every row to
-- the Firebase identity that owns the request.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;
grant execute on function public.firebase_uid() to anon, authenticated;

-- Admin helpers are required by profile and account-review policies/RPCs.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = public.firebase_uid()
      and p.role = 'Admin'
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = public.firebase_uid()
  limit 1;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_user_role() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.current_user_role() to anon, authenticated;

drop policy if exists "profiles_can_be_viewed_by_firebase_owner_pre_activation" on public.profiles;
create policy "profiles_can_be_viewed_by_firebase_owner_pre_activation"
  on public.profiles
  for select
  to anon
  using (
    public.firebase_uid() is not null
    and (
      id = public.firebase_uid()
      or email = nullif(auth.jwt() ->> 'email', '')
    )
  );

drop policy if exists "profiles_can_be_created_by_firebase_owner_pre_activation" on public.profiles;
create policy "profiles_can_be_created_by_firebase_owner_pre_activation"
  on public.profiles
  for insert
  to anon
  with check (
    public.firebase_uid() is not null
    and id = public.firebase_uid()
    and role in ('Borrower', 'Lender', 'Faculty')
  );

create or replace function public.review_user_account(
  p_profile_id text,
  p_action text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review account registrations';
  end if;

  if p_action = 'Approve' then
    update public.profiles
    set is_activated = true,
        activation_status = 'Approved',
        activated_at = now(),
        activated_by = public.firebase_uid(),
        rejection_reason = null,
        updated_at = now()
    where id = p_profile_id;
  elsif p_action = 'Reject' then
    update public.profiles
    set is_activated = false,
        activation_status = 'Rejected',
        activated_at = null,
        activated_by = public.firebase_uid(),
        rejection_reason = nullif(trim(coalesce(p_reason, '')), ''),
        updated_at = now()
    where id = p_profile_id;
  else
    raise exception 'Invalid account review action';
  end if;
end;
$$;

revoke all on function public.review_user_account(text, text, text) from public;
grant execute on function public.review_user_account(text, text, text) to anon, authenticated;

-- One-time, self-service bootstrap for the first administrator.
-- The Firebase identity must own the email and there may be no existing Admin profile.
create or replace function public.bootstrap_first_admin(
  p_email text,
  p_full_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := public.firebase_uid();
  v_email text;
  v_profile_id text;
begin
  if v_uid is null then
    raise exception 'Firebase authentication is required';
  end if;

  v_email := nullif(trim(auth.jwt() ->> 'email'), '');
  if v_email is null or lower(v_email) <> lower(trim(p_email)) then
    raise exception 'The requested email must match the authenticated Firebase account';
  end if;

  if exists (
    select 1 from public.profiles where role = 'Admin'
  ) then
    raise exception 'An administrator already exists';
  end if;

  select id into v_profile_id
  from public.profiles
  where id = v_uid or lower(email) = lower(trim(p_email))
  limit 1;

  if v_profile_id is null then
    insert into public.profiles (
      id, email, full_name, role, is_activated, activation_status, activated_at, activated_by
    )
    values (
      v_uid, lower(trim(p_email)), trim(p_full_name), 'Admin',
      true, 'Approved', now(), v_uid
    )
    returning id into v_profile_id;
  else
    update public.profiles
    set id = v_uid,
        email = lower(trim(p_email)),
        full_name = nullif(trim(p_full_name), ''),
        role = 'Admin',
        is_activated = true,
        activation_status = 'Approved',
        activated_at = now(),
        activated_by = v_uid,
        rejection_reason = null,
        updated_at = now()
    where id = v_profile_id;
  end if;

  return v_profile_id;
end;
$$;

revoke all on function public.bootstrap_first_admin(text, text) from public;
grant execute on function public.bootstrap_first_admin(text, text) to anon, authenticated;
