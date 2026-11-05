create or replace function public.replace_stale_profile_on_reregistration(
  p_email text,
  p_full_name text default null,
  p_role text default 'Borrower',
  p_student_number text default null,
  p_employee_number text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := public.firebase_uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_old_profile_id text;
  v_role public.user_role := case
    when p_role in ('Borrower', 'Lender', 'Faculty') then p_role::public.user_role
    else 'Borrower'::public.user_role
  end;
  v_old_role public.user_role;
  v_table record;
  v_temp_email text;
begin
  if v_uid is null or v_uid = '' then
    raise exception 'Authentication is required';
  end if;

  if v_email = '' then
    raise exception 'A valid email address is required';
  end if;

  if lower(coalesce(auth.jwt() ->> 'email', '')) <> v_email then
    raise exception 'The authenticated email does not match the registration email';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    update public.profiles
    set
      role = 'Admin',
      is_activated = true,
      activation_status = 'Approved',
      activated_at = coalesce(activated_at, now()),
      activated_by = coalesce(activated_by, v_uid),
      rejection_reason = null,
      updated_at = now()
    where id = v_uid
      and role = 'Admin';
    return;
  end if;

  select id into v_old_profile_id
  from public.profiles
  where lower(email) = v_email
    and id <> v_uid
  limit 1;

  if v_old_profile_id is null then
    return;
  end if;

  select role into v_old_role
  from public.profiles
  where id = v_old_profile_id;

  -- Create the new UID profile first so foreign-key remaps never point to
  -- an ID that is absent from profiles. Keep the old profile temporarily
  -- until all references have been updated.
  v_temp_email := '__replaced_profile_' || v_uid || '@borrowit.local';

  update public.profiles
  set email = v_temp_email
  where id = v_old_profile_id;

  if v_old_role = 'Admin'::public.user_role then
    insert into public.profiles (
      id, email, full_name, role, student_number, employee_number,
      is_restricted, restriction_until, late_return_count,
      is_activated, activation_status, activated_at, activated_by,
      rejection_reason, created_at, updated_at
    )
    select
      v_uid, v_email,
      coalesce(nullif(trim(coalesce(p_full_name, '')), ''), old.full_name),
      'Admin'::public.user_role,
      old.student_number, old.employee_number,
      old.is_restricted, old.restriction_until, old.late_return_count,
      true, 'Approved', coalesce(old.activated_at, now()), old.activated_by,
      null, old.created_at, now()
    from public.profiles old
    where old.id = v_old_profile_id;

    update public.profiles
    set
      role = 'Admin',
      is_activated = true,
      activation_status = 'Approved',
      activated_at = coalesce(activated_at, now()),
      activated_by = coalesce(activated_by, v_uid),
      rejection_reason = null,
      updated_at = now()
    where id = v_uid;
  else
    insert into public.profiles (
      id, email, full_name, role, student_number, employee_number,
      is_restricted, restriction_until, late_return_count,
      is_activated, activation_status, activated_at, activated_by,
      rejection_reason, created_at, updated_at
    )
    select
      v_uid, v_email,
      nullif(trim(coalesce(p_full_name, '')), ''),
      v_role,
      nullif(trim(coalesce(p_student_number, '')), ''),
      nullif(trim(coalesce(p_employee_number, '')), ''),
      false, null, 0,
      false, 'Pending', null, null, null, now(), now();
  end if;

  -- Remap every profile foreign key. The placeholder new profile now exists,
  -- so equipment reviewed_by and similar references remain valid immediately.
  for v_table in
    select
      tc.table_schema,
      tc.table_name,
      kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
     and tc.table_schema = ccu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'profiles'
      and ccu.column_name = 'id'
  loop
    execute format(
      'update %I.%I set %I = $1 where %I = $2',
      v_table.table_schema,
      v_table.table_name,
      v_table.column_name,
      v_table.column_name
    ) using v_uid, v_old_profile_id;
  end loop;

  delete from public.profiles where id = v_old_profile_id;
end;
$$;

revoke all on function public.replace_stale_profile_on_reregistration(text, text, text, text, text) from public;
grant execute on function public.replace_stale_profile_on_reregistration(text, text, text, text, text) to anon, authenticated;
