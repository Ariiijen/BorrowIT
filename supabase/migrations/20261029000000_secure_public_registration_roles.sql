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
    'Borrower'::public.user_role,
    new.raw_user_meta_data ->> 'student_number',
    new.raw_user_meta_data ->> 'employee_number'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
