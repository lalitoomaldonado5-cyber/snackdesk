begin;
-- Private bucket: no public logo URLs. Application signs current tenant's path.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('business-logos', 'business-logos', false, 2097152, array['image/png','image/jpeg','image/webp']);
create policy logos_read on storage.objects for select to authenticated
using (bucket_id = 'business-logos' and name = (select private.current_business_id())::text || '/logo');
create policy logos_insert on storage.objects for insert to authenticated
with check (bucket_id = 'business-logos' and name = (select private.current_business_id())::text || '/logo' and (select private.is_owner()));
create policy logos_update on storage.objects for update to authenticated
using (bucket_id = 'business-logos' and name = (select private.current_business_id())::text || '/logo' and (select private.is_owner()))
with check (bucket_id = 'business-logos' and name = (select private.current_business_id())::text || '/logo' and (select private.is_owner()));
create policy logos_delete on storage.objects for delete to authenticated
using (bucket_id = 'business-logos' and name = (select private.current_business_id())::text || '/logo' and (select private.is_owner()));
commit;
