grant select, update on public.notification_delivery to anon, authenticated;
grant select on public.notifications to anon, authenticated;

drop policy if exists "notification_delivery_admin_manage" on public.notification_delivery;
create policy "notification_delivery_admin_manage"
  on public.notification_delivery
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "notifications_viewable_by_admin" on public.notifications;
create policy "notifications_viewable_by_admin"
  on public.notifications
  for select
  using (public.is_admin());
