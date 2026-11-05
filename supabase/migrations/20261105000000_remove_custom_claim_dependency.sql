drop policy if exists "equipment_are_viewable_by_all_auth_users" on public.equipment;

create policy "equipment_are_viewable_by_all_auth_users"
  on public.equipment
  for select
  using (
    auth.uid() is not null
    and (
      status = 'Available'
      or owner_id = auth.uid()::text
      or public.is_admin()
    )
  );
