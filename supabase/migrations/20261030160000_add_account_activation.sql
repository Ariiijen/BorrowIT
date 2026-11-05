alter table public.profiles
  add column if not exists is_activated boolean not null default true,
  add column if not exists activation_status text not null default 'Approved'
    check (activation_status in ('Pending', 'Approved', 'Rejected')),
  add column if not exists activated_at timestamp with time zone,
  add column if not exists activated_by text references public.profiles(id) on delete set null,
  add column if not exists rejection_reason text;

-- Preserve existing accounts during rollout.
update public.profiles
set
  is_activated = (role = 'Admin'),
  activation_status = case when role = 'Admin' then 'Approved' else 'Approved' end,
  activated_at = coalesce(activated_at, created_at)
where is_activated is false or activation_status = 'Approved';
