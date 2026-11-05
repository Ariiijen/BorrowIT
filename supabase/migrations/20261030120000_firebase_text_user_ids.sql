alter table public.profiles
  add column if not exists contact_number text,
  add column if not exists extension_requested_until timestamptz;

create table if not exists public.rental_extensions (
  id uuid primary key default gen_random_uuid(),
  borrowing_request_id uuid not null references public.borrowing_requests(id) on delete cascade,
  requester_id text not null,
  approved_by text,
  original_due_at timestamptz not null,
  requested_due_at timestamptz not null,
  reason text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.late_return_flags (
  id uuid primary key default gen_random_uuid(),
  borrowing_request_id uuid references public.borrowing_requests(id) on delete cascade,
  borrower_id text not null,
  reason text,
  flagged_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.notification_delivery (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  email text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Sent', 'Failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

do $$
declare
  constraint_row record;
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'equipment', 'borrowing_requests', 'notifications',
        'lending', 'return_record', 'dispute', 'audit_log',
        'rental_extensions', 'late_return_flags', 'notification_delivery'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;

  for constraint_row in
    select con.conname, con.conrelid::regclass as table_name
    from pg_constraint con
    where con.contype = 'f'
      and con.confrelid = 'public.profiles'::regclass
  loop
    execute format(
      'alter table %s drop constraint %I',
      constraint_row.table_name,
      constraint_row.conname
    );
  end loop;
end;
$$;

alter table public.profiles
  alter column id type text using id::text;

alter table public.equipment alter column owner_id type text using owner_id::text;
alter table public.borrowing_requests
  alter column borrower_id type text using borrower_id::text,
  alter column lender_id type text using lender_id::text;
alter table public.notifications alter column user_id type text using user_id::text;
alter table public.lending
  alter column lender_id type text using lender_id::text,
  alter column borrower_id type text using borrower_id::text;
alter table public.return_record alter column borrower_id type text using borrower_id::text;
alter table public.dispute
  alter column reporter_id type text using reporter_id::text,
  alter column against_user_id type text using against_user_id::text;
alter table public.audit_log alter column actor_id type text using actor_id::text;

alter table public.equipment
  add constraint equipment_owner_id_fkey
  foreign key (owner_id) references public.profiles(id) on delete cascade;
alter table public.borrowing_requests
  add constraint borrowing_requests_borrower_id_fkey
  foreign key (borrower_id) references public.profiles(id) on delete cascade,
  add constraint borrowing_requests_lender_id_fkey
  foreign key (lender_id) references public.profiles(id) on delete set null;
alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.lending
  add constraint lending_lender_id_fkey
  foreign key (lender_id) references public.profiles(id) on delete cascade,
  add constraint lending_borrower_id_fkey
  foreign key (borrower_id) references public.profiles(id) on delete cascade;
alter table public.return_record
  add constraint return_record_borrower_id_fkey
  foreign key (borrower_id) references public.profiles(id) on delete cascade;
alter table public.dispute
  add constraint dispute_reporter_id_fkey
  foreign key (reporter_id) references public.profiles(id) on delete cascade,
  add constraint dispute_against_user_id_fkey
  foreign key (against_user_id) references public.profiles(id) on delete cascade;
alter table public.audit_log
  add constraint audit_log_actor_id_fkey
  foreign key (actor_id) references public.profiles(id) on delete set null;

alter table public.rental_extensions
  alter column requester_id type text using requester_id::text,
  alter column approved_by type text using approved_by::text;
alter table public.rental_extensions
  add constraint rental_extensions_requester_id_fkey
  foreign key (requester_id) references public.profiles(id) on delete cascade,
  add constraint rental_extensions_approved_by_fkey
  foreign key (approved_by) references public.profiles(id) on delete set null;
alter table public.late_return_flags
  alter column borrower_id type text using borrower_id::text;
alter table public.late_return_flags
  add constraint late_return_flags_borrower_id_fkey
  foreign key (borrower_id) references public.profiles(id) on delete cascade;

create policy "profiles_are_viewable_by_owner_or_admin" on public.profiles for select
  using (auth.uid()::text = id or public.is_admin());
create policy "profiles_can_be_created_by_owner" on public.profiles for insert
  with check (auth.uid()::text = id and role in ('Borrower', 'Lender', 'Faculty'));
create policy "profiles_can_be_updated_by_owner_or_admin" on public.profiles for update
  using (auth.uid()::text = id or public.is_admin())
  with check (auth.uid()::text = id or public.is_admin());

create policy "equipment_are_viewable_by_all_auth_users" on public.equipment for select
  using (auth.role() = 'authenticated' and (status = 'Available' or owner_id = auth.uid()::text or public.is_admin()));
create policy "lenders_and_admins_can_insert_equipment" on public.equipment for insert
  with check ((auth.uid()::text = owner_id and owner_type = 'Student' and public.current_user_role() = 'Lender') or (public.is_admin() and owner_type = 'School'));
create policy "owners_and_admins_can_update_equipment" on public.equipment for update
  using (auth.uid()::text = owner_id or public.is_admin())
  with check (auth.uid()::text = owner_id or public.is_admin());
create policy "owners_can_delete_available_equipment" on public.equipment for delete
  using ((auth.uid()::text = owner_id and status = 'Available') or public.is_admin());

create policy "borrowing_requests_are_viewable_by_related_users" on public.borrowing_requests for select
  using (auth.uid()::text = borrower_id or auth.uid()::text = lender_id or exists (
    select 1 from public.equipment e where e.id = equipment_id and e.owner_id = auth.uid()::text
  ) or public.is_admin());
create policy "borrowers_can_create_pending_requests" on public.borrowing_requests for insert
  with check (auth.uid()::text = borrower_id and lender_id is null and status = 'Pending' and exists (
    select 1 from public.equipment e where e.id = equipment_id and e.owner_id <> auth.uid()::text and e.status = 'Available'
  ));
create policy "borrowers_can_cancel_pending_requests" on public.borrowing_requests for update
  using (auth.uid()::text = borrower_id and status = 'Pending')
  with check (auth.uid()::text = borrower_id and status in ('Pending', 'Cancelled'));
create policy "owners_and_admins_can_review_requests" on public.borrowing_requests for update
  using (public.is_admin() or exists (
    select 1 from public.equipment e where e.id = equipment_id and e.owner_id = auth.uid()::text
  ))
  with check (public.is_admin() or exists (
    select 1 from public.equipment e where e.id = equipment_id and e.owner_id = auth.uid()::text
  ));

create policy "notifications_are_viewable_by_owner" on public.notifications for select using (auth.uid()::text = user_id);
create policy "notifications_can_be_updated_by_owner" on public.notifications for update using (auth.uid()::text = user_id);
create policy "notifications_can_be_deleted_by_owner" on public.notifications for delete using (auth.uid()::text = user_id);
create policy "lending_is_visible_to_related_users" on public.lending for select
  using (borrower_id = auth.uid()::text or lender_id = auth.uid()::text or public.is_admin());
create policy "return_records_are_visible_to_related_users" on public.return_record for select
  using (borrower_id = auth.uid()::text or exists (
    select 1 from public.equipment e where e.id = equipment_id and e.owner_id = auth.uid()::text
  ) or public.is_admin());
create policy "borrowers_can_record_their_own_returns" on public.return_record for insert
  with check (borrower_id = auth.uid()::text and exists (
    select 1 from public.lending l where l.id = lending_id
      and l.borrowing_request_id = return_record.borrowing_request_id
      and l.equipment_id = return_record.equipment_id
      and l.borrower_id = auth.uid()::text
      and l.status = 'Borrowed'
  ));
create policy "disputes_are_visible_to_participants_or_admins" on public.dispute for select
  using (reporter_id = auth.uid()::text or against_user_id = auth.uid()::text or public.is_admin());
create policy "participants_can_report_disputes" on public.dispute for insert
  with check (reporter_id = auth.uid()::text and exists (
    select 1 from public.borrowing_requests br left join public.equipment e on e.id = br.equipment_id
    where br.id = borrowing_request_id and (br.borrower_id = auth.uid()::text or e.owner_id = auth.uid()::text)
  ));
create policy "admins_can_resolve_disputes" on public.dispute for update
  using (public.is_admin()) with check (public.is_admin());
create policy "admins_can_read_audit_log" on public.audit_log for select using (public.is_admin());

create policy "extension_participants_can_view" on public.rental_extensions for select
  using (requester_id = auth.uid()::text or exists (
    select 1 from public.borrowing_requests br join public.equipment e on e.id = br.equipment_id
    where br.id = borrowing_request_id and e.owner_id = auth.uid()::text
  ) or public.is_admin());
create policy "extension_participants_can_insert" on public.rental_extensions for insert
  with check (requester_id = auth.uid()::text);
create policy "late_flags_visible_to_admins" on public.late_return_flags for select using (public.is_admin());
create policy "notification_delivery_visible_to_admins" on public.notification_delivery for select using (public.is_admin());
create policy "notification_delivery_owner_can_manage" on public.notification_delivery for all
  using (exists (
    select 1 from public.notifications n
    where n.id = notification_delivery.notification_id and n.user_id = auth.uid()::text
  ))
  with check (exists (
    select 1 from public.notifications n
    where n.id = notification_delivery.notification_id and n.user_id = auth.uid()::text
  ));


create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role = 'Admin'); $$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select p.role from public.profiles p where p.id = auth.uid()::text; $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
