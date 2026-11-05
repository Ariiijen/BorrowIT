-- Firebase third-party JWT sessions may use either the Supabase "anon" or
-- "authenticated" Postgres role. Application authorization remains enforced
-- by firebase_uid(), is_admin(), and the RLS policies below.

create or replace function public.firebase_uid()
returns text
language sql
stable
security definer
set search_path = public
as $$ select nullif(auth.jwt() ->> 'sub', ''); $$;

revoke all on function public.firebase_uid() from public;
grant execute on function public.firebase_uid() to anon, authenticated;

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
    where (
      p.id = public.firebase_uid()
      or (
        nullif(auth.jwt() ->> 'email', '') is not null
        and lower(p.email) = lower(auth.jwt() ->> 'email')
      )
    )
      and p.role = 'Admin'
      and p.is_activated = true
      and p.activation_status = 'Approved'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Dashboard and browsing reads
grant select on public.profiles to anon, authenticated;
grant select on public.equipment to anon, authenticated;
grant select on public.borrowing_requests to anon, authenticated;
grant select on public.lending to anon, authenticated;
grant select on public.return_record to anon, authenticated;
grant select on public.rental_extensions to anon, authenticated;
grant select on public.dispute to anon, authenticated;
grant select on public.notifications to anon, authenticated;
grant select on public.notification_delivery to anon, authenticated;
grant select on public.audit_log to anon, authenticated;

-- Account and profile operations
grant insert, update on public.profiles to anon, authenticated;

-- Borrowing and lender posting operations
grant insert, update on public.borrowing_requests to anon, authenticated;
grant insert, update, delete on public.equipment to anon, authenticated;
grant insert, update on public.lending to anon, authenticated;
grant insert, update on public.return_record to anon, authenticated;
grant insert, update on public.rental_extensions to anon, authenticated;
grant insert, update on public.dispute to anon, authenticated;
grant insert, update, delete on public.notifications to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

-- Recreate the borrow insert policy for both possible Supabase JWT roles.
drop policy if exists "firebase_anon_can_create_pending_requests" on public.borrowing_requests;
create policy "firebase_anon_can_create_pending_requests"
  on public.borrowing_requests
  for insert
  to anon
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

drop policy if exists "firebase_authenticated_can_create_pending_requests" on public.borrowing_requests;
create policy "firebase_authenticated_can_create_pending_requests"
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

-- Public catalog browsing is never anonymous data access: it is protected by
-- equipment RLS and contains status/owner restrictions.
drop policy if exists "equipment_is_viewable_by_firebase_user_or_admin" on public.equipment;
create policy "equipment_is_viewable_by_firebase_user_or_admin"
  on public.equipment
  for select
  to anon, authenticated
  using (
    status = 'Available'
    or owner_id = public.firebase_uid()
    or public.is_admin()
  );

-- Explicit profile visibility to prevent dashboard breakage for accounts
-- signed in with a Firebase JWT whose Postgres role is "anon".
drop policy if exists "profiles_are_visible_to_owner_or_admin_firebase" on public.profiles;
create policy "profiles_are_visible_to_owner_or_admin_firebase"
  on public.profiles
  for select
  to anon, authenticated
  using (
    public.firebase_uid() = id
    or public.is_admin()
  );

drop policy if exists "profiles_can_be_created_by_firebase_owner_registration" on public.profiles;
create policy "profiles_can_be_created_by_firebase_owner_registration"
  on public.profiles
  for insert
  to anon, authenticated
  with check (
    public.firebase_uid() is not null
    and id = public.firebase_uid()
    and role in ('Borrower', 'Lender', 'Faculty')
    and activation_status = 'Pending'
  );

-- Admin pages use this SECURITY DEFINER function instead of depending on
-- profile SELECT policies. The function verifies the Firebase UID directly.
create or replace function public.list_profiles_for_admin()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := public.firebase_uid();
begin
  if v_uid is null or not exists (
    select 1
    from public.profiles p
    where (
      p.id = v_uid
      or (
        nullif(auth.jwt() ->> 'email', '') is not null
        and lower(p.email) = lower(auth.jwt() ->> 'email')
      )
    )
      and p.role = 'Admin'
      and p.is_activated = true
      and p.activation_status = 'Approved'
  ) then
    raise exception 'Only administrators can view user registrations';
  end if;

  return query
    select *
    from public.profiles
    order by created_at desc;
end;
$$;

revoke all on function public.list_profiles_for_admin() from public;
grant execute on function public.list_profiles_for_admin() to anon, authenticated;

-- Audit records use profile foreign keys. Existing profiles may be keyed by
-- a different identifier than the Firebase UID, so resolve the actor by UID
-- or verified JWT email and otherwise store a null actor.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
  v_uid text := public.firebase_uid();
  v_actor_id text;
begin
  if tg_op <> 'INSERT' then old_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_row := to_jsonb(new); end if;

  select p.id
  into v_actor_id
  from public.profiles p
  where p.id = v_uid
     or (
       nullif(auth.jwt() ->> 'email', '') is not null
       and lower(p.email) = lower(auth.jwt() ->> 'email')
     )
  order by case when p.id = v_uid then 0 else 1 end
  limit 1;

  insert into public.audit_log (
    actor_id, action, table_name, record_id, old_data, new_data
  )
  values (
    v_actor_id,
    tg_op,
    tg_table_name,
    coalesce(new_row ->> 'id', old_row ->> 'id'),
    old_row,
    new_row
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Account activation stores activated_by as a profiles.id foreign key. The
-- Firebase UID and profile ID differ in the existing admin setup, so resolve
-- the administrator profile by UID first and then by verified JWT email.
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
declare
  v_actor_id text;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review account registrations';
  end if;

  select p.id
  into v_actor_id
  from public.profiles p
  where p.id = public.firebase_uid()
     or (
       nullif(auth.jwt() ->> 'email', '') is not null
       and lower(p.email) = lower(auth.jwt() ->> 'email')
     )
  order by case when p.id = public.firebase_uid() then 0 else 1 end
  limit 1;

  if p_action = 'Approve' then
    update public.profiles
    set is_activated = true,
        activation_status = 'Approved',
        activated_at = now(),
        activated_by = v_actor_id,
        rejection_reason = null,
        updated_at = now()
    where id = p_profile_id;
  elsif p_action = 'Reject' then
    update public.profiles
    set is_activated = false,
        activation_status = 'Rejected',
        activated_at = null,
        activated_by = v_actor_id,
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
      id, email, full_name, role, is_activated, activation_status,
      activated_at, activated_by
    )
    values (
      v_uid, lower(trim(p_email)), trim(p_full_name), 'Admin',
      true, 'Approved', now(), null
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
        activated_by = null,
        rejection_reason = null,
        updated_at = now()
    where id = v_profile_id;
  end if;

  return v_profile_id;
end;
$$;

revoke all on function public.bootstrap_first_admin(text, text) from public;
grant execute on function public.bootstrap_first_admin(text, text) to anon, authenticated;

-- Firebase third-party JWT requests can arrive as either "anon" or
-- "authenticated". Grant borrowing workflow RPC access explicitly to both.
revoke all on function public.approve_borrowing_request(uuid) from public;
revoke all on function public.reject_borrowing_request(uuid, text) from public;
revoke all on function public.cancel_accepted_request(uuid, text) from public;
revoke all on function public.mark_request_picked_up(uuid) from public;
revoke all on function public.record_lender_return(uuid, public.equipment_condition, text) from public;

grant execute on function public.approve_borrowing_request(uuid) to anon, authenticated;
grant execute on function public.reject_borrowing_request(uuid, text) to anon, authenticated;
grant execute on function public.cancel_accepted_request(uuid, text) to anon, authenticated;
grant execute on function public.mark_request_picked_up(uuid) to anon, authenticated;

create or replace function public.record_lender_return(
  p_request_id uuid,
  p_condition public.equipment_condition,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.borrowing_requests%rowtype;
  v_lending_id uuid;
  v_lender_id text;
begin
  select * into target
  from public.borrowing_requests
  where id = p_request_id
  for update;

  if target.id is null then
    raise exception 'Borrowing request not found';
  end if;

  if exists (
    select 1
    from public.return_record rr
    where rr.borrowing_request_id = p_request_id
  ) then
    update public.borrowing_requests
    set status = 'Returned',
        returned_at = coalesce(returned_at, now())
    where id = p_request_id
      and status <> 'Returned';
    return;
  end if;

  if target.status <> 'Borrowed' then
    raise exception 'Request is not currently borrowed';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.equipment e
    where e.id = target.equipment_id
      and e.owner_id = public.firebase_uid()
  ) then
    raise exception 'You cannot record this return';
  end if;

  select l.id
  into v_lending_id
  from public.lending l
  where l.borrowing_request_id = p_request_id
  limit 1;

  select e.owner_id
  into v_lender_id
  from public.equipment e
  where e.id = target.equipment_id;

  if v_lending_id is null then
    insert into public.lending (
      borrowing_request_id, equipment_id, lender_id, borrower_id,
      start_date, end_date, status
    )
    values (
      p_request_id, target.equipment_id,
      coalesce(v_lender_id, target.lender_id),
      target.borrower_id, target.start_date, target.end_date, 'Borrowed'
    )
    returning id into v_lending_id;
  end if;

  insert into public.return_record (
    lending_id, borrowing_request_id, equipment_id, borrower_id,
    condition, notes
  )
  values (
    v_lending_id, p_request_id, target.equipment_id, target.borrower_id,
    p_condition, p_notes
  );

  update public.lending
  set status = 'Returned', updated_at = now()
  where id = v_lending_id;

  update public.borrowing_requests
  set status = 'Returned',
      returned_at = now()
  where id = p_request_id
    and status = 'Borrowed';

  update public.equipment
  set status = 'Available',
      updated_at = now()
  where id = target.equipment_id;

  insert into public.notifications (user_id, type, message)
  values (
    target.borrower_id,
    'ReturnRecorded',
    'The equipment return has been recorded.'
  );
end;
$$;

revoke all on function public.record_lender_return(uuid, public.equipment_condition, text) from public;
grant execute on function public.record_lender_return(uuid, public.equipment_condition, text) to anon, authenticated;
grant execute on function public.record_lender_return(uuid, public.equipment_condition, text) to anon, authenticated;

-- Keep workflow columns used by the application and compensate for projects
-- created from earlier migrations that omitted these rollout fields.
alter table public.borrowing_requests
  add column if not exists picked_up_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists cancellation_reason text;

create or replace function public.mark_request_picked_up(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.borrowing_requests%rowtype;
begin
  select * into target
  from public.borrowing_requests
  where id = p_request_id
  for update;

  if target.id is null then
    raise exception 'Borrowing request not found';
  end if;
  if not public.is_admin() and target.lender_id <> public.firebase_uid() then
    raise exception 'You cannot mark this request as picked up';
  end if;
  if target.status <> 'Borrowed' then
    raise exception 'Request is not approved';
  end if;

  update public.borrowing_requests
  set picked_up_at = coalesce(picked_up_at, now()),
      approved_at = coalesce(approved_at, now())
  where id = p_request_id;
end;
$$;

revoke all on function public.mark_request_picked_up(uuid) from public;
grant execute on function public.mark_request_picked_up(uuid) to anon, authenticated;
