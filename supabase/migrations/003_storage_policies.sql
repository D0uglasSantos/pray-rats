-- Políticas de Storage para fotos de check-in e avatares

create policy "Checkin images are publicly readable"
on storage.objects for select
using (bucket_id = 'checkins');

create policy "Users can upload own checkin images"
on storage.objects for insert
with check (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own checkin images"
on storage.objects for update
using (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own checkin images"
on storage.objects for delete
using (
  bucket_id = 'checkins'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Avatars are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
