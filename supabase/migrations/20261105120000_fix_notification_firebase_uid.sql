-- Firebase uses text UIDs; notification recipients must use the same text type as profiles.id.
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
    select 1
    from public.profiles
    where id = p_user_id
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
