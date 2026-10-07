-- Dry-run report only. Review results and delete objects manually after verification.
select o.id, o.name, o.created_at
from storage.objects o
left join public.listing_images i
  on i.storage_path = o.name or i.thumb_path = o.name
where o.bucket_id = 'listing-media'
  and i.id is null
order by o.created_at;
