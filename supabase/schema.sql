-- BorrowIT database schema for Supabase
-- This file defines the base tables for profiles, equipment, borrowing requests, and notifications.

create extension if not exists "uuid-ossp";

create type public.user_role as enum ('Borrower', 'Lender', 'Faculty', 'Admin');
create type public.equipment_status as enum ('Available', 'Pending', 'Borrowed', 'Unavailable');
create type public.equipment_condition as enum ('New', 'Good', 'Fair', 'Damaged');
create type public.borrowing_status as enum ('Pending', 'Borrowed', 'Returned', 'Cancelled');
create type public.notification_type as enum (
  'RequestCreated',
  'RequestApproved',
  'RequestRejected',
  'DueSoon',
  'Overdue',
  'ReturnRecorded',
  'DisputeFiled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'Borrower',
  student_number text,
  employee_number text,
  is_restricted boolean not null default false,
  restriction_until timestamptz,
  late_return_count integer not null default 0 check (late_return_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.equipment (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text not null,
  condition public.equipment_condition not null default 'New',
  status public.equipment_status not null default 'Available',
  owner_type text not null default 'Student' check (owner_type in ('Student', 'School')),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.borrowing_requests (
  id uuid primary key default uuid_generate_v4(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  borrower_id uuid not null references public.profiles(id) on delete cascade,
  lender_id uuid references public.profiles(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status public.borrowing_status not null default 'Pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  due_date timestamptz,
  returned_at timestamptz,
  notes text,
  check (borrower_id <> lender_id),
  check (end_date >= start_date)
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lending (
  id uuid primary key default uuid_generate_v4(),
  borrowing_request_id uuid not null unique references public.borrowing_requests(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  lender_id uuid not null references public.profiles(id) on delete cascade,
  borrower_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('Borrowed', 'Returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.return_record (
  id uuid primary key default uuid_generate_v4(),
  lending_id uuid not null references public.lending(id) on delete cascade,
  borrowing_request_id uuid not null references public.borrowing_requests(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  borrower_id uuid not null references public.profiles(id) on delete cascade,
  condition public.equipment_condition not null,
  notes text,
  returned_at timestamptz not null default now()
);

create table public.dispute (
  id uuid primary key default uuid_generate_v4(),
  borrowing_request_id uuid not null references public.borrowing_requests(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  against_user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  status text not null default 'Open' check (status in ('Open', 'UnderReview', 'Resolved', 'Dismissed')),
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> against_user_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.borrowing_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.lending enable row level security;
alter table public.return_record enable row level security;
alter table public.dispute enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'Admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

create policy "profiles_are_viewable_by_owner_or_admin"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or public.is_admin()
  );

create policy "profiles_can_be_created_by_owner"
  on public.profiles
  for insert
  with check (
    auth.uid() = id
    and role in ('Borrower', 'Lender', 'Faculty')
  );

create policy "profiles_can_be_updated_by_owner_or_admin"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "equipment_are_viewable_by_all_auth_users"
  on public.equipment
  for select
  using (
    auth.role() = 'authenticated'
    and (status = 'Available' or owner_id = auth.uid() or public.is_admin())
  );

create policy "lenders_and_admins_can_insert_equipment"
  on public.equipment
  for insert
  with check (
    (auth.uid() = owner_id and owner_type = 'Student' and public.current_user_role() = 'Lender')
    or (public.is_admin() and owner_type = 'School')
  );

create policy "owners_and_admins_can_update_equipment"
  on public.equipment
  for update
  using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

create policy "owners_can_delete_available_equipment"
  on public.equipment
  for delete
  using ((auth.uid() = owner_id and status = 'Available') or public.is_admin());

create policy "borrowing_requests_are_viewable_by_related_users"
  on public.borrowing_requests
  for select
  using (
    auth.uid() = borrower_id
    or auth.uid() = lender_id
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "borrowers_can_create_pending_requests"
  on public.borrowing_requests
  for insert
  with check (
    auth.uid() = borrower_id
    and lender_id is null
    and status = 'Pending'
    and exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and e.owner_id <> auth.uid()
        and e.status = 'Available'
    )
  );

create policy "borrowers_can_cancel_pending_requests"
  on public.borrowing_requests
  for update
  using (auth.uid() = borrower_id and status = 'Pending')
  with check (auth.uid() = borrower_id and status in ('Pending', 'Cancelled'));

create policy "owners_and_admins_can_review_requests"
  on public.borrowing_requests
  for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = auth.uid()
    )
  );

create policy "notifications_are_viewable_by_owner"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "notifications_can_be_updated_by_owner"
  on public.notifications
  for update
  using (auth.uid() = user_id);

create policy "notifications_can_be_deleted_by_owner"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

create policy "lending_is_visible_to_related_users"
  on public.lending
  for select
  using (borrower_id = auth.uid() or lender_id = auth.uid() or public.is_admin());

create policy "return_records_are_visible_to_related_users"
  on public.return_record
  for select
  using (
    borrower_id = auth.uid()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "borrowers_can_record_their_own_returns"
  on public.return_record
  for insert
  with check (
    borrower_id = auth.uid()
    and exists (
      select 1 from public.lending l
      where l.id = lending_id
        and l.borrowing_request_id = return_record.borrowing_request_id
        and l.equipment_id = return_record.equipment_id
        and l.borrower_id = auth.uid()
        and l.status = 'Borrowed'
    )
  );

create policy "disputes_are_visible_to_participants_or_admins"
  on public.dispute
  for select
  using (reporter_id = auth.uid() or against_user_id = auth.uid() or public.is_admin());

create policy "participants_can_report_disputes"
  on public.dispute
  for insert
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.borrowing_requests br
      left join public.equipment e on e.id = br.equipment_id
      where br.id = borrowing_request_id
        and (br.borrower_id = auth.uid() or e.owner_id = auth.uid())
    )
  );

create policy "admins_can_resolve_disputes"
  on public.dispute
  for update
  using (public.is_admin())
  with check (public.is_admin());

revoke update on public.dispute from anon, authenticated;
grant update (status, resolution_notes) on public.dispute to authenticated;

create policy "admins_can_read_audit_log"
  on public.audit_log
  for select
  using (public.is_admin());

revoke update, delete on public.audit_log from anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, student_number, employee_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case new.raw_user_meta_data ->> 'role'
      when 'Lender' then 'Lender'::public.user_role
      when 'Faculty' then 'Faculty'::public.user_role
      else 'Borrower'::public.user_role
    end,
    new.raw_user_meta_data ->> 'student_number',
    new.raw_user_meta_data ->> 'employee_number'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger equipment_set_updated_at
  before update on public.equipment
  for each row execute function public.update_updated_at();

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_restricted := old.is_restricted;
    new.restriction_until := old.restriction_until;
    new.late_return_count := old.late_return_count;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

create or replace function public.sync_lending_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  equipment_owner uuid;
begin
  select e.owner_id into equipment_owner
  from public.equipment e where e.id = new.equipment_id;

  if new.status = 'Borrowed' then
    insert into public.lending (
      borrowing_request_id, equipment_id, lender_id, borrower_id,
      start_date, end_date, status
    ) values (
      new.id, new.equipment_id, equipment_owner,
      new.borrower_id, new.start_date, new.end_date, 'Borrowed'
    )
    on conflict (borrowing_request_id) do update set
      status = 'Borrowed', updated_at = now();
    update public.equipment set status = 'Borrowed' where id = new.equipment_id;
  elsif new.status = 'Returned' then
    update public.lending set status = 'Returned', updated_at = now()
    where borrowing_request_id = new.id;
    update public.equipment set status = 'Available' where id = new.equipment_id;
  end if;

  return new;
end;
$$;

create trigger borrowing_request_sync_lending
  after insert or update of status on public.borrowing_requests
  for each row execute function public.sync_lending_record();

create or replace function public.prevent_double_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.equipment where id = new.equipment_id for update;
  if exists (
    select 1 from public.borrowing_requests br
    where br.equipment_id = new.equipment_id
      and br.id is distinct from new.id
      and br.status in ('Pending', 'Borrowed')
      and daterange(br.start_date, br.end_date, '[]')
          && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception 'This equipment is already requested for overlapping dates.'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger borrowing_requests_prevent_overlap
  before insert or update of equipment_id, start_date, end_date, status
  on public.borrowing_requests
  for each row execute function public.prevent_double_booking();

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
  insert into public.audit_log (actor_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(), tg_op, tg_table_name,
    coalesce(new_row ->> 'id', old_row ->> 'id'),
    old_row, new_row
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger equipment_audit_changes
  after insert or update or delete on public.equipment
  for each row execute function public.audit_row_change();

create trigger borrowing_requests_audit_changes
  after insert or update or delete on public.borrowing_requests
  for each row execute function public.audit_row_change();

create trigger profiles_audit_changes
  after update on public.profiles
  for each row execute function public.audit_row_change();

create trigger return_record_audit_changes
  after insert or update or delete on public.return_record
  for each row execute function public.audit_row_change();

create trigger disputes_audit_changes
  after insert or update or delete on public.dispute
  for each row execute function public.audit_row_change();

create or replace function public.sync_return_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.borrowing_requests
  set status = 'Returned', returned_at = new.returned_at
  where id = new.borrowing_request_id and status = 'Borrowed';
  return new;
end;
$$;

create trigger return_record_close_borrowing
  after insert on public.return_record
  for each row execute function public.sync_return_record();

create or replace function public.create_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, type, message)
  values (p_user_id, p_type, p_message)
  returning id into notification_id;
  return notification_id;
end;
$$;

revoke all on function public.create_notification(uuid, public.notification_type, text) from public;
grant execute on function public.create_notification(uuid, public.notification_type, text) to service_role;
