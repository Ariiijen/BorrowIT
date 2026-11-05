-- Seed data for BorrowIT demo usage
-- This file is optional and meant for local testing or development setup.

insert into public.profiles (id, email, full_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@borrowit.edu', 'System Admin', 'Admin'),
  ('22222222-2222-2222-2222-222222222222', 'lender@borrowit.edu', 'Faculty Lender', 'Lender'),
  ('33333333-3333-3333-3333-333333333333', 'borrower@borrowit.edu', 'Student Borrower', 'Borrower')
on conflict (id) do nothing;

insert into public.equipment (name, description, category, condition, status, owner_id, terms, usage_instructions)
values
  ('Laptop Dell XPS 13', 'Portable laptop for student assignments, research, presentations, and software work.', 'Computing', 'Good', 'Available', '22222222-2222-2222-2222-222222222222', 'Borrow for the approved dates only, return on time, and report damage immediately.', 'Inspect the laptop and charger before use, keep liquids away, and shut down before returning all accessories.'),
  ('Projector Epson EB-970', 'Classroom projector for slides, videos, demonstrations, and approved presentations.', 'AV', 'New', 'Available', '22222222-2222-2222-2222-222222222222', 'Borrow for the approved dates only, return on time, and report damage immediately.', 'Check cables before use, keep ventilation clear, switch off before cooling, and return the projector with its accessories.'),
  ('Digital Oscilloscope', 'Laboratory oscilloscope for electronics measurements, experiments, and approved coursework.', 'Electronics', 'Fair', 'Borrowed', '22222222-2222-2222-2222-222222222222', 'Borrow for the approved dates only, return on time, and report damage immediately.', 'Inspect probes and cables before use, follow laboratory safety procedures, keep the device dry, and return it with all accessories.')
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
