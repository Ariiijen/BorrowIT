-- Emergency restore for the seeded Equipment Office administrator.
-- This migration is intentionally explicit so the demonstration login is not
-- converted into a Pending account by the profile activation trigger.

update public.profiles
set
  role = 'Admin',
  is_activated = true,
  activation_status = 'Approved',
  activated_at = coalesce(activated_at, now()),
  activated_by = coalesce(activated_by, id),
  rejection_reason = null,
  updated_at = now()
where lower(email) = lower('equipment.office@ustp.edu.ph')
   or id = 'school-inventory-office';
