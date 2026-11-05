alter table public.profiles
  alter column is_activated set default false,
  alter column activation_status set default 'Pending';

create or replace function public.require_profile_activation_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_activated := false;
  new.activation_status := 'Pending';
  new.activated_at := null;
  new.activated_by := null;
  new.rejection_reason := null;
  return new;
end;
$$;

drop trigger if exists enforce_profile_activation_on_insert on public.profiles;

create trigger enforce_profile_activation_on_insert
before insert on public.profiles
for each row
execute function public.require_profile_activation_on_insert();
