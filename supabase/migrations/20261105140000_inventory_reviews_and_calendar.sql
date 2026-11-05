-- Inventory, overlapping reservations, and lender submission review.

alter table public.equipment
  add column if not exists total_stock integer not null default 1,
  add column if not exists available_stock integer not null default 1,
  add column if not exists terms text,
  add column if not exists usage_instructions text,
  add column if not exists review_status text not null default 'Approved',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text references public.profiles(id),
  add column if not exists rejection_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_total_stock_check'
  ) then
    alter table public.equipment
      add constraint equipment_total_stock_check check (total_stock >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_available_stock_check'
  ) then
    alter table public.equipment
      add constraint equipment_available_stock_check
      check (available_stock >= 0 and available_stock <= total_stock);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'equipment_review_status_check'
  ) then
    alter table public.equipment
      add constraint equipment_review_status_check
      check (review_status in ('Pending', 'Approved', 'Rejected'));
  end if;
end;
$$;

update public.equipment
set total_stock = greatest(coalesce(total_stock, 1), 1),
    available_stock = greatest(coalesce(available_stock, 1), 0),
    review_status = coalesce(review_status, 'Approved');

insert into storage.buckets (id, name, public)
values ('equipment-images', 'equipment-images', true)
on conflict (id) do update set public = true;

drop policy if exists "equipment_images_public_read" on storage.objects;
create policy "equipment_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'equipment-images');

drop policy if exists "equipment_images_authenticated_upload" on storage.objects;
create policy "equipment_images_authenticated_upload"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'equipment-images'
  and (storage.foldername(name))[1] is not null
);

drop policy if exists "equipment_images_authenticated_update" on storage.objects;
create policy "equipment_images_authenticated_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'equipment-images')
with check (bucket_id = 'equipment-images');

drop policy if exists "equipment_images_authenticated_delete" on storage.objects;
create policy "equipment_images_authenticated_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'equipment-images');

grant select, insert, update, delete on public.equipment to anon, authenticated;

create or replace function public.create_borrow_request(
  p_equipment_id uuid,
  p_start_date date,
  p_end_date date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_equipment public.equipment%rowtype;
  v_uid text := public.firebase_uid();
  v_request_id uuid;
  v_overlapping_count integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_end_date < p_start_date then raise exception 'Return date must be on or after the start date'; end if;

  select * into v_equipment
  from public.equipment
  where id = p_equipment_id
  for update;

  if v_equipment.id is null then raise exception 'Equipment not found'; end if;
  if v_equipment.owner_id = v_uid then raise exception 'You cannot borrow your own equipment'; end if;
  if v_equipment.review_status <> 'Approved' then raise exception 'This equipment has not been approved yet'; end if;
  if v_equipment.available_stock < 1 then raise exception 'No stock is currently available'; end if;

  select count(*)
  into v_overlapping_count
  from public.borrowing_requests br
  where br.equipment_id = p_equipment_id
    and br.status in ('Pending', 'Borrowed')
    and br.start_date <= p_end_date
    and br.end_date >= p_start_date;

  if v_overlapping_count >= v_equipment.total_stock then
    raise exception 'No units are available for the selected dates';
  end if;

  insert into public.borrowing_requests (
    equipment_id, borrower_id, lender_id,
    start_date, end_date, notes, status
  )
  values (
    p_equipment_id, v_uid, v_equipment.owner_id,
    p_start_date, p_end_date, p_notes, 'Pending'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.create_borrow_request(uuid, date, date, text) from public;
grant execute on function public.create_borrow_request(uuid, date, date, text) to anon, authenticated;

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
begin
  if not public.is_admin() then raise exception 'Only administrators can review equipment'; end if;

  select * into target from public.equipment where id = p_equipment_id for update;
  if target.id is null then raise exception 'Equipment not found'; end if;

  if p_approved then
    v_stock := coalesce(p_total_stock, target.total_stock);
    if v_stock < 1 then raise exception 'Approved equipment must have at least one unit'; end if;

    update public.equipment
    set review_status = 'Approved',
        total_stock = v_stock,
        available_stock = v_stock,
        status = 'Available',
        reviewed_at = now(),
        reviewed_by = (
          select id from public.profiles
          where role = 'Admin'
            and is_activated = true
            and activation_status = 'Approved'
            and (email = nullif(auth.jwt() ->> 'email', '') or id = public.firebase_uid())
          order by updated_at desc nulls last
          limit 1
        ),
        rejection_reason = null,
        updated_at = now()
    where id = p_equipment_id;
  else
    update public.equipment
    set review_status = 'Rejected',
        status = 'Unavailable',
        available_stock = 0,
        reviewed_at = now(),
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
  if not public.is_admin() then raise exception 'Only administrators can set stock'; end if;
  if p_total_stock < 0 then raise exception 'Stock cannot be negative'; end if;

  select * into target from public.equipment where id = p_equipment_id for update;
  if target.id is null then raise exception 'Equipment not found'; end if;

  select count(*)
  into v_borrowed
  from public.borrowing_requests
  where equipment_id = p_equipment_id and status = 'Borrowed';

  if p_total_stock < v_borrowed then
    raise exception 'Total stock cannot be less than the units currently borrowed';
  end if;

  update public.equipment
  set total_stock = p_total_stock,
      available_stock = greatest(0, p_total_stock - v_borrowed),
      status = case when p_total_stock > v_borrowed then 'Available' else 'Borrowed' end,
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
  select * into target from public.borrowing_requests where id = p_request_id for update;
  if target.id is null then raise exception 'Borrowing request not found'; end if;
  if target.status <> 'Pending' then raise exception 'Only pending requests can be approved'; end if;
  if not public.is_admin() and not exists (
    select 1 from public.equipment e
    where e.id = target.equipment_id and e.owner_id = public.firebase_uid()
  ) then raise exception 'You cannot approve this request'; end if;

  select * into v_equipment from public.equipment
  where id = target.equipment_id for update;
  if v_equipment.review_status <> 'Approved' then raise exception 'Equipment is not approved'; end if;
  if v_equipment.available_stock < 1 then raise exception 'No stock is available'; end if;

  update public.borrowing_requests
  set status = 'Borrowed',
      lender_id = v_equipment.owner_id,
      approved_at = now(),
      due_date = target.end_date
  where id = p_request_id;

  update public.equipment
  set available_stock = available_stock - 1,
      status = case when available_stock - 1 <= 0 then 'Borrowed' else 'Available' end,
      updated_at = now()
  where id = target.equipment_id;

  insert into public.notifications (user_id, type, message)
  values (target.borrower_id, 'RequestApproved', 'Your borrowing request has been approved.');
end;
$$;

revoke all on function public.approve_borrowing_request(uuid) from public;
grant execute on function public.approve_borrowing_request(uuid) to anon, authenticated;

create or replace function public.sync_borrowing_request_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'Borrowed'
     and new.status in ('Returned', 'Cancelled') then
    update public.equipment
    set available_stock = least(total_stock, available_stock + 1),
        status = case when least(total_stock, available_stock + 1) > 0 then 'Available' else 'Unavailable' end,
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

-- Keep catalog RLS compatible with lender review: owners and admins can see
-- pending/rejected submissions, while the public catalog sees only approved items.
drop policy if exists "equipment_is_viewable_by_firebase_user_or_admin" on public.equipment;
create policy "equipment_is_viewable_by_firebase_user_or_admin"
  on public.equipment
  for select
  to anon, authenticated
  using (
    review_status = 'Approved'
    or owner_id = public.firebase_uid()
    or public.is_admin()
  );
