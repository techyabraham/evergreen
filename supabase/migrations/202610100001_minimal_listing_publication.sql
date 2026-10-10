-- Keep admin publication practical: a short title and one correctly described cover image are enough.
-- Facts, price, location, availability confirmation, and fee details may be added later.
alter table public.property_details alter column property_type drop not null;
alter table public.vehicle_details alter column make drop not null;
alter table public.vehicle_details alter column model drop not null;

create or replace function public.publish_readiness(p_listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 l public.listings%rowtype;
 issue_list jsonb:='[]'::jsonb;
 image_count int;
 cover_count int;
 cover_alt text;
begin
 select * into l from public.listings where id=p_listing_id;
 if not found then
  return jsonb_build_object('ready',false,'issues',jsonb_build_array(jsonb_build_object('code','listing_missing','field','listing','message','Listing was not found.')));
 end if;
 if char_length(trim(l.title))<5 then
  issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','title_short','field','title','message','Add a listing title.'));
 end if;
 select count(*),count(*) filter(where is_cover),max(alt_text) filter(where is_cover)
 into image_count,cover_count,cover_alt
 from public.listing_images where listing_id=p_listing_id;
 if image_count<1 then
  issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','photos_minimum','field','images','message','Add at least 1 photo before publishing.'));
 end if;
 if cover_count<>1 or coalesce(trim(cover_alt),'')='' then
  issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','cover_required','field','images','message','Set one cover photo and add an accurate photo description.'));
 end if;
 return jsonb_build_object('ready',jsonb_array_length(issue_list)=0,'issues',issue_list);
end $$;
revoke all on function public.publish_readiness(uuid) from public,anon,authenticated;
grant execute on function public.publish_readiness(uuid) to service_role;
