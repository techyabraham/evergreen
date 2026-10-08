-- Public demonstration records are fictional examples. They are explicitly
-- identified and excluded from enquiry, report, and availability workflows.
alter table public.listings add column if not exists is_demo boolean not null default false;

insert into public.locations(level,name,slug,sort_order)
values ('state','Oyo State','oyo-state',3)
on conflict do nothing;

insert into public.locations(parent_id,level,name,slug,sort_order)
select state.id,'city','Ibadan','ibadan',1
from public.locations state
where state.level='state' and state.slug='oyo-state'
on conflict do nothing;

insert into public.locations(parent_id,level,name,slug,sort_order)
select city.id, 'area', v.name, v.slug, v.sort_order
from public.locations city
cross join (values ('Bodija','bodija',1),('Jericho','jericho',2),('Akobo','akobo',3)) as v(name,slug,sort_order)
where city.level='city' and city.slug='ibadan'
on conflict do nothing;

create or replace function public.trg_listings_status() returns trigger language plpgsql security definer set search_path='' as $$
declare allowed boolean:=true; ready jsonb; previous_status text;
begin
 if new.status='unavailable' then raise exception 'Use draft or archived status'; end if;
 if tg_op='UPDATE' and old.status<>new.status then
  previous_status=old.status::text;
  allowed=case old.status::text
   when 'draft' then new.status::text in ('published','archived')
   when 'published' then new.status::text in ('under_offer','rented','sold','archived','draft')
   when 'under_offer' then new.status::text in ('published','rented','sold','archived')
   when 'rented' then new.status::text in ('archived','published')
   when 'sold' then new.status::text in ('archived','published')
   when 'archived' then new.status::text='draft'
   else false end;
  if not allowed then raise exception 'Invalid listing status transition: % to %',old.status,new.status; end if;
  if old.status in ('rented','sold') and new.status='published' and nullif(current_setting('app.relist_note',true),'') is null then raise exception 'Relisting requires a note'; end if;
  new.status_changed_at=now();
  if new.status='published' and old.status<>'published' then new.published_at=now(); end if;
  if new.status='rented' then new.rented_at=coalesce(new.rented_at,now()); end if;
  if new.status='sold' then new.sold_at=coalesce(new.sold_at,now()); end if;
  insert into public.listing_status_events(listing_id,from_status,to_status,note,changed_by)
  values(new.id,previous_status,new.status::text,nullif(current_setting('app.relist_note',true),''),nullif(current_setting('request.jwt.claim.sub',true),'')::uuid);
 end if;
 if new.status in ('published','under_offer') then
  if new.category='vehicle' and new.purpose<>'sale' then raise exception 'Vehicles can only be listed for sale'; end if;
  if new.category='vehicle' and not coalesce((select cars_enabled from public.site_settings where id=true),true) then raise exception 'Vehicle listings are disabled'; end if;
  if new.purpose='short_let' and not coalesce((select short_let_enabled from public.site_settings where id=true),false) then raise exception 'Short-let listings are disabled'; end if;
  if not new.price_on_request and new.purpose='rent' and new.price_period not in ('year','month') then raise exception 'Rental period must be annual or monthly'; end if;
  if not new.price_on_request and new.purpose='short_let' and new.price_period<>'day' then raise exception 'Short-let price period must be nightly'; end if;
  if not new.price_on_request and new.purpose='sale' and new.price_period<>'one_time' then raise exception 'Sale price period must be one-time'; end if;
  if new.is_demo then
   ready=jsonb_build_object('ready',true,'issues','[]'::jsonb);
  else
   ready=public.publish_readiness(new.id);
  end if;
  if not coalesce((ready->>'ready')::boolean,false) then raise exception 'Listing is not ready to publish: %',ready->'issues'; end if;
 end if;
 return new;
end $$;

create or replace function public.submit_enquiry(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare listing public.listings%rowtype; contact_value text; retention int;
begin
 if jsonb_typeof(p)<>'object' or coalesce(length(p->>'name'),0) not between 2 and 100 or coalesce(length(p->>'message'),0)>1000 or
    coalesce(p->>'consent','false')<>'true' or coalesce(p->>'preferred_contact','') not in ('whatsapp','call','email') or
    coalesce(p->>'request_type','availability') not in ('availability','inspection','price','general','property_request') then
   return jsonb_build_object('ok',false,'code','INVALID');
 end if;
 if coalesce(p->>'listing_reference','')<>'' then
   select * into listing from public.listings where reference_code=p->>'listing_reference' and status in ('published','under_offer') and not is_demo;
   if not found then return jsonb_build_object('ok',false,'code','INVALID'); end if;
 end if;
 contact_value=coalesce(nullif(p->>'phone_normalized',''),nullif(lower(p->>'email'),''));
 if contact_value is null then return jsonb_build_object('ok',false,'code','INVALID'); end if;
 if not public.rl_hit('enq:ip:'||coalesce(p->>'ip_hash','unknown'),600,5) or not public.rl_hit('enq:contact:'||contact_value,3600,3) or not public.rl_hit('enq:global',3600,100) then
   return jsonb_build_object('ok',false,'code','RATE_LIMITED'); end if;
 if exists(select 1 from public.enquiries e where coalesce(e.phone_normalized,lower(e.email))=contact_value and e.listing_id is not distinct from listing.id and e.created_at>now()-interval '10 minutes' and md5(e.message)=md5(coalesce(p->>'message',''))) then
   return jsonb_build_object('ok',true);
 end if;
 select enquiry_retention_days into retention from public.site_settings where id=true;
 insert into public.enquiries(listing_id,listing_reference_snapshot,listing_title_snapshot,request_type,name,phone,phone_normalized,email,message,preferred_contact,criteria,consent_at,consent_version,source_path,utm,ip_hash,purge_after)
 values(listing.id,listing.reference_code,listing.title,coalesce(p->>'request_type','availability'),p->>'name',nullif(p->>'phone',''),nullif(p->>'phone_normalized',''),nullif(lower(p->>'email'),''),coalesce(p->>'message',''),case when p->>'preferred_contact'='call' then 'phone' else p->>'preferred_contact' end,p->'criteria',now(),'v1',left(p->>'source_path',500),p->'utm',p->>'ip_hash',now()+make_interval(days=>coalesce(retention,365)));
 return jsonb_build_object('ok',true);
exception when others then
 return jsonb_build_object('ok',false,'code','INVALID');
end $$;
revoke all on function public.submit_enquiry(jsonb) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;

create or replace function public.submit_listing_report(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare listing_id_value uuid;
begin
 if coalesce(p->>'reason','') not in ('no_longer_available','incorrect_info','suspected_fraud','marketed_without_consent','offensive_content','other') or length(coalesce(p->>'details',''))>500 then return jsonb_build_object('ok',false,'code','INVALID'); end if;
 if not public.rl_hit('report:ip:'||coalesce(p->>'ip_hash','unknown'),600,5) then return jsonb_build_object('ok',false,'code','RATE_LIMITED'); end if;
 select id into listing_id_value from public.listings where reference_code=p->>'listing_reference' and status in ('published','under_offer') and not is_demo;
 if listing_id_value is null then return jsonb_build_object('ok',false,'code','INVALID'); end if;
 insert into public.listing_reports(listing_id,reason,details,contact,ip_hash) values(listing_id_value,p->>'reason',nullif(p->>'details',''),nullif(p->>'contact',''),p->>'ip_hash');
 return jsonb_build_object('ok',true);
exception when others then return jsonb_build_object('ok',false,'code','INVALID');
end $$;
revoke all on function public.submit_listing_report(jsonb) from public,anon,authenticated;
grant execute on function public.submit_listing_report(jsonb) to service_role;

create or replace function public.log_contact_event(p_listing_ref text,p_event text,p_source_path text,p_ip_hash text default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 if p_event not in ('whatsapp_click','call_click','form_submit','share_click') then return; end if;
 if not public.rl_hit('event:ip:'||coalesce(p_ip_hash,'unknown'),60,30) then return; end if;
 insert into public.contact_events(listing_id,event_type,source_path)
 select id,p_event,left(p_source_path,500) from public.listings where reference_code=p_listing_ref and status in ('published','under_offer') and not is_demo;
end $$;
revoke all on function public.log_contact_event(text,text,text,text) from public,anon,authenticated;
grant execute on function public.log_contact_event(text,text,text,text) to service_role;

do $$
declare admin_id uuid;
begin
 select id into admin_id from public.profiles where role='admin' order by created_at limit 1;
 if admin_id is null then raise exception 'Create an admin Auth user and matching public.profiles row before applying the demo listings migration.'; end if;

 insert into public.listings(slug,reference_code,category,purpose,title,description,price_amount,currency,price_period,price_on_request,negotiable,state,city,area,public_location,status,featured,last_confirmed_at,published_at,created_by,location_id,is_demo)
 select v.slug,v.reference_code,'property','sale',v.title,
  'DEMONSTRATION ONLY. This is a fictional sample, not a real Evergreen property. All property details and the neighborhood pairing are illustrative. The stock photo does not depict this sample home. It is not available for rent or sale.',
  null,'NGN',null,true,false,v.state_name,v.city_name,v.area_name,v.public_location,'published',false,null,now(),admin_id,area_loc.id,true
 from (values
  ('demo-bodija-family-home','DM3A4B','Demo · Family Home in Bodija','Oyo State','Ibadan','Bodija','bodija','Bodija, Ibadan, Oyo State',1),
  ('demo-lekki-modern-home','DM3C5D','Demo · Modern Home in Lekki','Lagos','Lagos','Lekki','lekki','Lekki, Lagos',2),
  ('demo-maitama-family-home','DM3E6F','Demo · Family Home in Maitama','Abuja (FCT)','Abuja','Maitama','maitama','Maitama, Abuja (FCT)',3)
 ) as v(slug,reference_code,title,state_name,city_name,area_name,location_slug,public_location,sort_order)
 join public.locations area_loc on area_loc.slug=v.location_slug and area_loc.name=v.area_name and area_loc.level in ('area','city')
 join public.locations parent_loc on parent_loc.id=area_loc.parent_id
  and ((v.city_name='Ibadan' and parent_loc.level='city' and parent_loc.slug='ibadan')
   or (v.city_name in ('Lagos','Abuja') and parent_loc.level='state' and parent_loc.slug=case v.city_name when 'Lagos' then 'lagos' else 'abuja-fct' end))
 on conflict(reference_code) do nothing;

 insert into public.property_details(listing_id,property_type,bedrooms,bathrooms,toilets,furnishing,amenities)
 select l.id,v.property_type,v.bedrooms,v.bedrooms, v.bedrooms,'unfurnished','{}'::text[]
 from (values ('DM3A4B','detached_duplex',3),('DM3C5D','flat',2),('DM3E6F','semi_detached_duplex',4)) as v(reference_code,property_type,bedrooms)
 join public.listings l on l.reference_code=v.reference_code and l.is_demo
 on conflict(listing_id) do nothing;

 insert into public.listing_images(listing_id,storage_path,alt_text,sort_order,is_cover,width,height)
 select l.id,v.storage_path,'Illustrative Unsplash stock image; not a photograph of this sample property.',0,true,1400,900
 from (values ('DM3A4B','demo-assets/bodija-exterior'),('DM3C5D','demo-assets/lekki-exterior'),('DM3E6F','demo-assets/maitama-interior')) as v(reference_code,storage_path)
 join public.listings l on l.reference_code=v.reference_code and l.is_demo
 on conflict(storage_path) do nothing;
end $$;
