-- Allow Firebase JWT sessions to upload and delete equipment images.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'equipment-images',
  'equipment-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "equipment_images_public_read" on storage.objects;
drop policy if exists "equipment_images_authenticated_upload" on storage.objects;
drop policy if exists "equipment_images_authenticated_update" on storage.objects;
drop policy if exists "equipment_images_authenticated_delete" on storage.objects;
drop policy if exists "equipment_images_upload_firebase" on storage.objects;
drop policy if exists "equipment_images_manage_firebase" on storage.objects;
drop policy if exists "equipment_images_read_firebase" on storage.objects;

create policy "equipment_images_read_firebase"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'equipment-images');

create policy "equipment_images_upload_firebase"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'equipment-images'
  and public.firebase_uid() is not null
  and (
    public.is_admin()
    or public.current_user_role() = 'Lender'
  )
  and (storage.foldername(name))[1] = public.firebase_uid()
);

create policy "equipment_images_manage_firebase"
on storage.objects for update
to anon, authenticated
using (
  bucket_id = 'equipment-images'
  and public.firebase_uid() is not null
  and (
    public.is_admin()
    or public.current_user_role() = 'Lender'
  )
  and (storage.foldername(name))[1] = public.firebase_uid()
)
with check (
  bucket_id = 'equipment-images'
  and public.firebase_uid() is not null
  and (storage.foldername(name))[1] = public.firebase_uid()
);

create policy "equipment_images_delete_firebase"
on storage.objects for delete
to anon, authenticated
using (
  bucket_id = 'equipment-images'
  and public.firebase_uid() is not null
  and (
    public.is_admin()
    or public.current_user_role() = 'Lender'
  )
  and (storage.foldername(name))[1] = public.firebase_uid()
);

-- Restore the equipment insert/update policy for the third-party Firebase role.
drop policy if exists "lenders_and_admins_can_insert_equipment" on public.equipment;
create policy "lenders_and_admins_can_insert_equipment"
on public.equipment for insert
to anon, authenticated
with check (
  public.firebase_uid() = owner_id
  and (
    public.current_user_role() = 'Lender'
    or public.is_admin()
  )
);

drop policy if exists "owners_and_admins_can_update_equipment" on public.equipment;
create policy "owners_and_admins_can_update_equipment"
on public.equipment for update
to anon, authenticated
using (public.firebase_uid() = owner_id or public.is_admin())
with check (public.firebase_uid() = owner_id or public.is_admin());
