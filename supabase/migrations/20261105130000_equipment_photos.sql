-- Add catalog photos and keep equipment images database-backed.

alter table public.equipment
  add column if not exists image_url text;

insert into public.profiles (
  id, email, full_name, role, employee_number,
  is_activated, activation_status, activated_at
)
values (
  'school-inventory-office',
  'equipment.office@ustp.edu.ph',
  'USTP Equipment Office',
  'Admin',
  'USTP-EQUIPMENT-OFFICE',
  true,
  'Approved',
  now()
)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_activated = true,
  activation_status = 'Approved';

update public.equipment
set owner_id = 'school-inventory-office',
    owner_type = 'School',
    status = case when status = 'Unavailable' then 'Available' else status end
where name in (
  'Dell Latitude Laptop',
  'Logitech Conference Camera',
  'Canon EOS Camera Kit',
  'Portable Projector',
  'Scientific Calculator',
  'Portable PA Speaker',
  'Microsoft Surface Pro',
  'Campus Wi-Fi Hotspot'
);

update public.equipment
set image_url = v.image_url
from (values
  ('Dell Latitude Laptop', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85'),
  ('Logitech Conference Camera', 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=85'),
  ('Canon EOS Camera Kit', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85'),
  ('Portable Projector', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/35mm_Film_Portable_Projector_-_Kolkata_2017-02-23_5557.JPG/1280px-35mm_Film_Portable_Projector_-_Kolkata_2017-02-23_5557.JPG'),
  ('Scientific Calculator', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=85'),
  ('Portable PA Speaker', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=85'),
  ('Microsoft Surface Pro', 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=85'),
  ('Campus Wi-Fi Hotspot', 'https://images.unsplash.com/photo-1601524909162-ae8725290836?auto=format&fit=crop&w=1200&q=85')
) as v(name, image_url)
where public.equipment.name = v.name
  and public.equipment.image_url is null;

update public.equipment
set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/35mm_Film_Portable_Projector_-_Kolkata_2017-02-23_5557.JPG/1280px-35mm_Film_Portable_Projector_-_Kolkata_2017-02-23_5557.JPG'
where name = 'Portable Projector'
  and (
    image_url is null
    or image_url like '%1577083552431-6e5fd01988a5%'
  );
