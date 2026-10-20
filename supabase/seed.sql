-- Seed data for BorrowIT demo usage
-- This file is optional and meant for local testing or development setup.

insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@borrowit.edu', 'System Admin', 'Admin'),
  ('22222222-2222-2222-2222-222222222222', 'lender@borrowit.edu', 'Faculty Lender', 'Lender'),
  ('33333333-3333-3333-3333-333333333333', 'borrower@borrowit.edu', 'Student Borrower', 'Borrower')
on conflict (id) do nothing;

insert into public.equipment (name, description, category, condition, status, owner_id)
values
  ('Laptop Dell XPS 13', 'Lightweight laptop for student assignments', 'Computing', 'Good', 'Available', '22222222-2222-2222-2222-222222222222'),
  ('Projector Epson EB-970', 'Large classroom projector', 'AV', 'New', 'Available', '22222222-2222-2222-2222-222222222222'),
  ('Digital Oscilloscope', 'Used for electronics labs', 'Electronics', 'Fair', 'Borrowed', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.borrowing_requests (equipment_id, borrower_id, lender_id, status, due_date, notes)
values
  (
    (select id from public.equipment where name = 'Digital Oscilloscope' limit 1),
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Borrowed',
    now() + interval '7 days',
    'Borrowed for electronics lab assignment'
  );
