-- Fix PostgreSQL enum assignments used by equipment approval and stock RPCs.

create or replace function public.review_equipment(
  p_equipment_id uuid,
  p_approved boolean,
  p_total_stock integer default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.equipment%rowtype;
  v_stock integer;
  v_admin_id text;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review equipment';
  end if;

  select * into target
  from public.equipment
  where id = p_equipment_id
  for update;
  if target.id is null then
    raise exception 'Equipment not found';
  end if;

  select id into v_admin_id
  from public.profiles
  where role = 'Admin'
    and is_activated = true
    and activation_status = 'Approved'
    and (
      email = nullif(auth.jwt() ->> 'email', '')
      or id = public.firebase_uid()
    )
  order by updated_at desc nulls last
  limit 1;

  if p_approved then
    v_stock := coalesce(p_total_stock, target.total_stock);
    if v_stock < 1 then
      raise exception 'Approved equipment must have at least one unit';
    end if;

    update public.equipment
    set review_status = 'Approved',
        total_stock = v_stock,
        available_stock = v_stock,
        status = 'Available'::public.equipment_status,
        reviewed_at = now(),
        reviewed_by = v_admin_id,
        rejection_reason = null,
        updated_at = now()
    where id = p_equipment_id;
  else
    update public.equipment
    set review_status = 'Rejected',
        status = 'Unavailable'::public.equipment_status,
        available_stock = 0,
        reviewed_at = now(),
        reviewed_by = v_admin_id,
        rejection_reason = nullif(btrim(coalesce(p_reason, '')), ''),
        updated_at = now()
    where id = p_equipment_id;
  end if;
end;
$$;

revoke all on function public.review_equipment(uuid, boolean, integer, text) from public;
grant execute on function public.review_equipment(uuid, boolean, integer, text) to anon, authenticated;

create or replace function public.set_equipment_stock(
  p_equipment_id uuid,
  p_total_stock integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.equipment%rowtype;
  v_borrowed integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can set stock';
  end if;
  if p_total_stock < 0 then
    raise exception 'Stock cannot be negative';
  end if;

  select * into target
  from public.equipment
  where id = p_equipment_id
  for update;
  if target.id is null then
    raise exception 'Equipment not found';
  end if;

  select count(*)
  into v_borrowed
  from public.borrowing_requests
  where equipment_id = p_equipment_id
    and status = 'Borrowed'::public.borrowing_status;

  if p_total_stock < v_borrowed then
    raise exception 'Total stock cannot be less than the units currently borrowed';
  end if;

  update public.equipment
  set total_stock = p_total_stock,
      available_stock = greatest(0, p_total_stock - v_borrowed),
      status = case
        when p_total_stock = 0 then 'Unavailable'::public.equipment_status
        when v_borrowed > 0 and p_total_stock = v_borrowed then 'Borrowed'::public.equipment_status
        else 'Available'::public.equipment_status
      end,
      updated_at = now()
  where id = p_equipment_id;
end;
$$;

revoke all on function public.set_equipment_stock(uuid, integer) from public;
grant execute on function public.set_equipment_stock(uuid, integer) to anon, authenticated;

create or replace function public.approve_borrowing_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.borrowing_requests%rowtype;
  v_equipment public.equipment%rowtype;
begin
  select * into target
  from public.borrowing_requests
  where id = p_request_id
  for update;
  if target.id is null then
    raise exception 'Borrowing request not found';
  end if;
  if target.status <> 'Pending'::public.borrowing_status then
    raise exception 'Only pending requests can be approved';
  end if;
  if not public.is_admin() and not exists (
    select 1 from public.equipment e
    where e.id = target.equipment_id
      and e.owner_id = public.firebase_uid()
  ) then
    raise exception 'You cannot approve this request';
  end if;

  select * into v_equipment
  from public.equipment
  where id = target.equipment_id
  for update;
  if v_equipment.review_status <> 'Approved' then
    raise exception 'Equipment is not approved';
  end if;
  if v_equipment.available_stock < 1 then
    raise exception 'No stock is available';
  end if;

  update public.borrowing_requests
  set status = 'Borrowed'::public.borrowing_status,
      lender_id = v_equipment.owner_id,
      approved_at = now(),
      due_date = target.end_date
  where id = p_request_id;

  update public.equipment
  set available_stock = available_stock - 1,
      status = case
        when available_stock - 1 <= 0
          then 'Borrowed'::public.equipment_status
        else 'Available'::public.equipment_status
      end,
      updated_at = now()
  where id = target.equipment_id;

  insert into public.notifications (user_id, type, message)
  values (
    target.borrower_id,
    'RequestApproved'::public.notification_type,
    'Your borrowing request has been approved.'
  );
end;
$$;

revoke all on function public.approve_borrowing_request(uuid) from public;
grant execute on function public.approve_borrowing_request(uuid) to anon, authenticated;

create or replace function public.sync_lending_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  equipment_owner text;
begin
  if tg_op = 'INSERT' or new.status = 'Pending'::public.borrowing_status then
    return new;
  end if;

  if new.status = 'Borrowed'::public.borrowing_status then
    select owner_id into equipment_owner
    from public.equipment
    where id = new.equipment_id;

    insert into public.lending (
      borrowing_request_id, equipment_id, lender_id, borrower_id,
      start_date, end_date, status
    )
    values (
      new.id, new.equipment_id, coalesce(new.lender_id, equipment_owner),
      new.borrower_id, new.start_date, new.end_date,
      'Borrowed'
    )
    on conflict (borrowing_request_id) do update set
      status = 'Borrowed',
      updated_at = now();
  elsif new.status = 'Returned'::public.borrowing_status then
    update public.lending
    set status = 'Returned',
        updated_at = now()
    where borrowing_request_id = new.id;
  end if;

  return new;
end;
$$;

create or replace function public.sync_borrowing_request_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'Borrowed'::public.borrowing_status
     and new.status in (
       'Returned'::public.borrowing_status,
       'Cancelled'::public.borrowing_status
     ) then
    update public.equipment
    set available_stock = least(total_stock, available_stock + 1),
        status = case
          when least(total_stock, available_stock + 1) > 0
            then 'Available'::public.equipment_status
          else 'Unavailable'::public.equipment_status
        end,
        updated_at = now()
    where id = new.equipment_id;
  end if;
  return new;
end;
$$;

drop trigger if exists borrowing_request_inventory_sync on public.borrowing_requests;
create trigger borrowing_request_inventory_sync
after update of status on public.borrowing_requests
for each row execute function public.sync_borrowing_request_inventory();
