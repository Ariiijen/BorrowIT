-- Add a real campus equipment catalog and complete the rental workflow RPCs.

do $$
declare
  owner text;
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    employee_number,
    is_activated,
    activation_status,
    activated_at
  )
  values (
    'school-inventory-office',
    'equipment.office@ustp.edu.ph',
    'USTP Equipment Office',
    'Admin',
    'USTP-EQUIPMENT-OFFICE',
    true,
    'Approved',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    is_activated = true,
    activation_status = 'Approved',
    activated_at = coalesce(public.profiles.activated_at, now());

  select p.id into owner
  from public.profiles p
  where p.id = 'school-inventory-office';

  if owner is not null then
    insert into public.equipment (name, description, category, condition, status, owner_type, owner_id)
    select seed.name, seed.description, seed.category, seed.condition, 'Available', 'School', owner
    from (values
      ('Dell Latitude Laptop', 'Campus checkout laptop with charger, suitable for classes, presentations, and software projects.', 'Computing', 'Good'::public.equipment_condition),
      ('Logitech Conference Camera', 'HD webcam with microphone for meetings, online classes, and recorded presentations.', 'Video', 'Good'::public.equipment_condition),
      ('Canon EOS Camera Kit', 'DSLR camera kit with standard lens and carrying case for approved photography projects.', 'Photography', 'Good'::public.equipment_condition),
      ('Portable Projector', 'Compact HDMI projector with power cable for classroom demonstrations and campus events.', 'Audio Visual', 'New'::public.equipment_condition),
      ('Scientific Calculator', 'Calculator set for engineering, mathematics, and laboratory use.', 'Learning Tools', 'Good'::public.equipment_condition),
      ('Portable PA Speaker', 'Rechargeable powered speaker with microphone for small events and presentations.', 'Audio', 'New'::public.equipment_condition),
      ('Microsoft Surface Pro', 'Touchscreen tablet laptop with stylus and keyboard for design and fieldwork.', 'Computing', 'Good'::public.equipment_condition),
      ('Campus Wi-Fi Hotspot', 'Portable internet hotspot intended for short-term academic fieldwork.', 'Networking', 'Fair'::public.equipment_condition)
    ) as seed(name, description, category, condition)
    where not exists (
      select 1 from public.equipment e where e.name = seed.name
    );

    update public.equipment
    set owner_id = owner,
        owner_type = 'School',
        status = case
          when status = 'Unavailable' then 'Available'
          else status
        end
    where name in (
      'Dell Latitude Laptop',
      'Logitech Conference Camera',
      'Canon EOS Camera Kit',
      'Portable Projector',
      'Scientific Calculator',
      'Portable PA Speaker',
      'Microsoft Surface Pro',
      'Campus Wi-Fi Hotspot'
    );
  end if;
end;
$$;

create or replace function public.firebase_uid()
returns text
language sql
stable
security definer
set search_path = public
as $$ select nullif(auth.jwt() ->> 'sub', ''); $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (
  select 1 from public.profiles p
  where p.id = public.firebase_uid()
    and p.role = 'Admin'
); $$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$ select p.role
  from public.profiles p
  where p.id = public.firebase_uid()
  limit 1; $$;

-- Fix the lending trigger for text Firebase owners instead of UUID.
create or replace function public.sync_lending_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  equipment_owner text;
begin
  select e.owner_id into equipment_owner
  from public.equipment e
  where e.id = new.equipment_id;

  if new.status = 'Borrowed' then
    insert into public.lending (
      borrowing_request_id, equipment_id, lender_id, borrower_id,
      start_date, end_date, status
    ) values (
      new.id, new.equipment_id, equipment_owner,
      new.borrower_id, new.start_date, new.end_date, 'Borrowed'
    )
    on conflict (borrowing_request_id) do update set
      lender_id = equipment_owner,
      status = 'Borrowed',
      updated_at = now();

    update public.equipment
    set status = 'Borrowed', updated_at = now()
    where id = new.equipment_id;
  elsif new.status = 'Returned' or new.status = 'Cancelled' then
    update public.lending
    set status = 'Returned', updated_at = now()
    where borrowing_request_id = new.id;

    update public.equipment
    set status = 'Available', updated_at = now()
    where id = new.equipment_id;
  end if;

  return new;
end;
$$;

-- Use the Firebase JWT UID for audit records.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
begin
  if tg_op <> 'INSERT' then old_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_row := to_jsonb(new); end if;

  insert into public.audit_log (
    actor_id, action, table_name, record_id, old_data, new_data
  )
  values (
    public.firebase_uid(),
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

create or replace function public.approve_borrowing_request(p_request_id uuid)
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

  if not public.is_admin() and not exists (
    select 1 from public.equipment e
    where e.id = target.equipment_id
      and e.owner_id = public.firebase_uid()
  ) then
    raise exception 'You cannot approve this request';
  end if;

  if target.status <> 'Pending' then
    raise exception 'Only pending requests can be approved';
  end if;

  update public.borrowing_requests
  set status = 'Borrowed',
      lender_id = (
        select owner_id from public.equipment where id = target.equipment_id
      ),
      approved_at = now(),
      due_date = target.end_date
  where id = p_request_id;

  insert into public.notifications (user_id, type, message)
  values (
    target.borrower_id,
    'RequestApproved',
    'Your borrowing request has been approved.'
  );
end;
$$;

create or replace function public.reject_borrowing_request(
  p_request_id uuid,
  p_reason text default null
)
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

  if target.id is null then raise exception 'Borrowing request not found'; end if;

  if not public.is_admin() and not exists (
    select 1 from public.equipment e
    where e.id = target.equipment_id
      and e.owner_id = public.firebase_uid()
  ) then
    raise exception 'You cannot reject this request';
  end if;

  if target.status <> 'Pending' then
    raise exception 'Only pending requests can be rejected';
  end if;

  update public.borrowing_requests
  set status = 'Cancelled'
  where id = p_request_id;

  insert into public.notifications (user_id, type, message)
  values (
    target.borrower_id,
    'RequestRejected',
    coalesce('Your borrowing request was rejected. Reason: ' || p_reason, 'Your borrowing request was rejected.')
  );
end;
$$;

create or replace function public.cancel_accepted_request(
  p_request_id uuid,
  p_reason text default null
)
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

  if target.id is null then raise exception 'Borrowing request not found'; end if;
  if public.firebase_uid() <> target.borrower_id and not public.is_admin() then
    raise exception 'You cannot cancel this request';
  end if;
  if target.status not in ('Pending', 'Borrowed') then
    raise exception 'This request cannot be cancelled';
  end if;

  update public.borrowing_requests
  set status = 'Cancelled'
  where id = p_request_id;
end;
$$;

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

  if target.id is null then raise exception 'Borrowing request not found'; end if;
  if not public.is_admin() and target.lender_id <> public.firebase_uid() then
    raise exception 'You cannot mark this request as picked up';
  end if;
  if target.status <> 'Borrowed' then raise exception 'Request is not approved'; end if;

  update public.borrowing_requests
  set approved_at = coalesce(approved_at, now())
  where id = p_request_id;
end;
$$;

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
  lending_id_value uuid;
begin
  select * into target
  from public.borrowing_requests
  where id = p_request_id
  for update;

  if target.id is null then raise exception 'Borrowing request not found'; end if;
  if not public.is_admin() and not exists (
    select 1 from public.equipment e
    where e.id = target.equipment_id
      and e.owner_id = public.firebase_uid()
  ) then
    raise exception 'You cannot record this return';
  end if;
  if target.status <> 'Borrowed' then raise exception 'Request is not currently borrowed'; end if;

  select l.id into lending_id_value
  from public.lending l
  where l.borrowing_request_id = p_request_id
  limit 1;

  insert into public.return_record (
    lending_id, borrowing_request_id, equipment_id, borrower_id, condition, notes
  )
  values (
    lending_id_value,
    p_request_id,
    target.equipment_id,
    target.borrower_id,
    p_condition,
    p_notes
  );

  insert into public.notifications (user_id, type, message)
  values (
    target.borrower_id,
    'ReturnRecorded',
    'The equipment return has been recorded.'
  );
end;
$$;

revoke all on function public.approve_borrowing_request(uuid) from public;
revoke all on function public.reject_borrowing_request(uuid, text) from public;
revoke all on function public.cancel_accepted_request(uuid, text) from public;
revoke all on function public.mark_request_picked_up(uuid) from public;
revoke all on function public.record_lender_return(uuid, public.equipment_condition, text) from public;

grant execute on function public.approve_borrowing_request(uuid) to authenticated;
grant execute on function public.reject_borrowing_request(uuid, text) to authenticated;
grant execute on function public.cancel_accepted_request(uuid, text) to authenticated;
grant execute on function public.mark_request_picked_up(uuid) to authenticated;
grant execute on function public.record_lender_return(uuid, public.equipment_condition, text) to authenticated;
