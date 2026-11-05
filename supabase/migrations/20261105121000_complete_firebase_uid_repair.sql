-- Repair Firebase UID compatibility across schema types, functions, and RLS.

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

-- Drop foreign keys that reference profiles before changing profile/user-ID types.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select con.conname, con.conrelid::regclass as table_name
    from pg_constraint con
    where con.contype = 'f'
      and con.confrelid = 'public.profiles'::regclass
  loop
    execute format(
      'alter table %s drop constraint if exists %I',
      constraint_row.table_name,
      constraint_row.conname
    );
  end loop;
end;
$$;

do $$
declare
  column_row record;
begin
  for column_row in
    select *
    from (values
      ('profiles'::text,'id'::text),
      ('equipment','owner_id'),
      ('borrowing_requests','borrower_id'),
      ('borrowing_requests','lender_id'),
      ('notifications','user_id'),
      ('lending','lender_id'),
      ('lending','borrower_id'),
      ('return_record','borrower_id'),
      ('dispute','reporter_id'),
      ('dispute','against_user_id'),
      ('audit_log','actor_id'),
      ('rental_extensions','requester_id'),
      ('rental_extensions','approved_by'),
      ('late_return_flags','borrower_id')
    ) as targets(table_name, column_name)
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = column_row.table_name
        and column_name = column_row.column_name
        and data_type <> 'text'
    ) then
      execute format(
        'alter table public.%I alter column %I type text using %I::text',
        column_row.table_name,
        column_row.column_name,
        column_row.column_name
      );
    end if;
  end loop;
end;
$$;

-- Restore profile foreign keys.
alter table public.equipment add constraint equipment_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete cascade;
alter table public.borrowing_requests add constraint borrowing_requests_borrower_id_fkey foreign key (borrower_id) references public.profiles(id) on delete cascade;
alter table public.borrowing_requests add constraint borrowing_requests_lender_id_fkey foreign key (lender_id) references public.profiles(id) on delete set null;
alter table public.notifications add constraint notifications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.lending add constraint lending_lender_id_fkey foreign key (lender_id) references public.profiles(id) on delete cascade;
alter table public.lending add constraint lending_borrower_id_fkey foreign key (borrower_id) references public.profiles(id) on delete cascade;
alter table public.return_record add constraint return_record_borrower_id_fkey foreign key (borrower_id) references public.profiles(id) on delete cascade;
alter table public.dispute add constraint dispute_reporter_id_fkey foreign key (reporter_id) references public.profiles(id) on delete cascade;
alter table public.dispute add constraint dispute_against_user_id_fkey foreign key (against_user_id) references public.profiles(id) on delete cascade;
alter table public.audit_log add constraint audit_log_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete set null;
alter table public.rental_extensions add constraint rental_extensions_requester_id_fkey foreign key (requester_id) references public.profiles(id) on delete cascade;
alter table public.rental_extensions add constraint rental_extensions_approved_by_fkey foreign key (approved_by) references public.profiles(id) on delete set null;
alter table public.late_return_flags add constraint late_return_flags_borrower_id_fkey foreign key (borrower_id) references public.profiles(id) on delete cascade;

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

revoke all on function public.firebase_uid() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.current_user_role() from public;
grant execute on function public.firebase_uid() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_user_role() to authenticated;

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

create policy "borrowing_requests_are_viewable_by_related_users"
  on public.borrowing_requests for select
  using (
    public.firebase_uid() = borrower_id
    or public.firebase_uid() = lender_id
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = public.firebase_uid()
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
  with check (public.firebase_uid() = borrower_id and status in ('Pending', 'Cancelled'));
create policy "owners_and_admins_can_review_requests"
  on public.borrowing_requests for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = public.firebase_uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.equipment e
      where e.id = equipment_id and e.owner_id = public.firebase_uid()
    )
  );

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

drop function if exists public.create_notification(uuid, public.notification_type, text);

create or replace function public.create_notification(
  p_user_id text,
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
  if not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    raise exception 'Unknown Firebase user ID: %', p_user_id;
  end if;

  insert into public.notifications (user_id, type, message)
  values (p_user_id, p_type, p_message)
  returning id into notification_id;

  return notification_id;
end;
$$;

revoke all on function public.create_notification(text, public.notification_type, text) from public;
grant execute on function public.create_notification(text, public.notification_type, text) to service_role;
