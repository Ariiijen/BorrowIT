-- Fix the confirmed dashboard failure: borrowing_requests.borrower_id must be text.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

alter table public.borrowing_requests
  drop constraint if exists borrowing_requests_borrower_id_fkey,
  drop constraint if exists borrowing_requests_lender_id_fkey;

alter table public.borrowing_requests
  alter column borrower_id type text using borrower_id::text,
  alter column lender_id type text using lender_id::text;

alter table public.borrowing_requests
  add constraint borrowing_requests_borrower_id_fkey
    foreign key (borrower_id) references public.profiles(id) on delete cascade,
  add constraint borrowing_requests_lender_id_fkey
    foreign key (lender_id) references public.profiles(id) on delete set null;

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
  select 1
  from public.profiles p
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

create policy "borrowing_requests_are_viewable_by_related_users"
  on public.borrowing_requests for select
  using (
    public.firebase_uid() = borrower_id
    or public.firebase_uid() = lender_id
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and e.owner_id = public.firebase_uid()
    )
    or public.is_admin()
  );

create policy "borrowers_can_create_pending_requests"
  on public.borrowing_requests for insert
  with check (
    public.firebase_uid() = borrower_id
    and lender_id is null
    and status = 'Pending'
    and exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and e.owner_id <> public.firebase_uid()
        and e.status = 'Available'
    )
  );

create policy "borrowers_can_cancel_pending_requests"
  on public.borrowing_requests for update
  using (public.firebase_uid() = borrower_id and status = 'Pending')
  with check (
    public.firebase_uid() = borrower_id
    and status in ('Pending', 'Cancelled')
  );

create policy "owners_and_admins_can_review_requests"
  on public.borrowing_requests for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and e.owner_id = public.firebase_uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and e.owner_id = public.firebase_uid()
    )
  );

create policy "profiles_are_viewable_by_owner_or_admin"
  on public.profiles for select
  using (id = public.firebase_uid() or public.is_admin());
create policy "profiles_can_be_created_by_owner"
  on public.profiles for insert
  with check (public.firebase_uid() = id and role in ('Borrower', 'Lender', 'Faculty'));
create policy "profiles_can_be_updated_by_owner_or_admin"
  on public.profiles for update
  using (public.firebase_uid() = id or public.is_admin())
  with check (public.firebase_uid() = id or public.is_admin());

create policy "equipment_is_viewable_by_authenticated_users"
  on public.equipment for select
  using (
    public.firebase_uid() is not null
    and (status = 'Available' or owner_id = public.firebase_uid() or public.is_admin())
  );
create policy "lenders_and_admins_can_insert_equipment"
  on public.equipment for insert
  with check (
    (public.firebase_uid() = owner_id and owner_type = 'Student' and public.current_user_role() = 'Lender')
    or (public.is_admin() and owner_type = 'School')
  );
create policy "owners_and_admins_can_update_equipment"
  on public.equipment for update
  using (public.firebase_uid() = owner_id or public.is_admin())
  with check (public.firebase_uid() = owner_id or public.is_admin());
create policy "owners_can_delete_available_equipment"
  on public.equipment for delete
  using ((public.firebase_uid() = owner_id and status = 'Available') or public.is_admin());

create policy "notifications_are_viewable_by_owner"
  on public.notifications for select
  using (public.firebase_uid() = user_id);
create policy "notifications_can_be_updated_by_owner"
  on public.notifications for update
  using (public.firebase_uid() = user_id);
create policy "notifications_can_be_deleted_by_owner"
  on public.notifications for delete
  using (public.firebase_uid() = user_id);

create policy "lending_is_visible_to_related_users"
  on public.lending for select
  using (
    borrower_id = public.firebase_uid()
    or lender_id = public.firebase_uid()
    or public.is_admin()
  );

create policy "return_records_are_visible_to_related_users"
  on public.return_record for select
  using (
    borrower_id = public.firebase_uid()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = public.firebase_uid()
    )
    or public.is_admin()
  );

create policy "disputes_are_visible_to_participants_or_admins"
  on public.dispute for select
  using (
    reporter_id = public.firebase_uid()
    or against_user_id = public.firebase_uid()
    or public.is_admin()
  );
create policy "participants_can_report_disputes"
  on public.dispute for insert
  with check (
    reporter_id = public.firebase_uid()
    and exists (
      select 1
      from public.borrowing_requests br
      left join public.equipment e on e.id = br.equipment_id
      where br.id = borrowing_request_id
        and (br.borrower_id = public.firebase_uid() or e.owner_id = public.firebase_uid())
    )
  );
create policy "admins_can_resolve_disputes"
  on public.dispute for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "admins_can_read_audit_log"
  on public.audit_log for select
  using (public.is_admin());
create policy "extension_participants_can_view"
  on public.rental_extensions for select
  using (
    requester_id = public.firebase_uid()
    or exists (
      select 1
      from public.borrowing_requests br
      join public.equipment e on e.id = br.equipment_id
      where br.id = borrowing_request_id and e.owner_id = public.firebase_uid()
    )
    or public.is_admin()
  );
create policy "extension_participants_can_insert"
  on public.rental_extensions for insert
  with check (requester_id = public.firebase_uid());
create policy "late_flags_visible_to_admins"
  on public.late_return_flags for select
  using (public.is_admin());
create policy "notification_delivery_visible_to_admins"
  on public.notification_delivery for select
  using (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
