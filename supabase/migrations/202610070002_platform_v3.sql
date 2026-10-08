-- Platform v3 upgrade. Keep the original migration immutable; this file upgrades
-- existing installations and also runs after it on a fresh local database.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.gen_reference_code() returns text
language plpgsql volatile set search_path = '' as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int;
begin
  loop
    code := '';
    for i in 1..6 loop code := code || substr(alphabet, 1 + floor(random()*32)::int, 1); end loop;
    exit when not exists (select 1 from public.listings where reference_code = code);
  end loop;
  return code;
end $$;

update public.listings set reference_code=public.gen_reference_code()
where reference_code !~ '^[A-HJ-NP-Z2-9]{6}$';
alter table public.listings alter column reference_code set default public.gen_reference_code();
alter table public.listings add constraint listings_reference_v3 check (reference_code ~ '^[A-HJ-NP-Z2-9]{6}$');

create table public.site_settings (
  id boolean primary key default true check (id),
  brand_name text not null default 'Your Brand', tagline text, logo_path text,
  realtor_name text, realtor_bio text, realtor_photo_path text, credentials_text text,
  whatsapp_number text, phone text, email text, office_address_public text,
  short_let_enabled boolean not null default false, cars_enabled boolean not null default true,
  show_exact_address boolean not null default false, stale_after_days int not null default 14 check(stale_after_days between 1 and 365),
  auto_hide_stale boolean not null default false, closed_listings_public_days int not null default 90 check(closed_listings_public_days between 0 and 730),
  enquiry_retention_days int not null default 365 check(enquiry_retention_days between 30 and 3650),
  privacy_contact_email text, safety_tips jsonb not null default '[]'::jsonb, social jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings default values on conflict do nothing;

create table public.locations (
  id uuid primary key default gen_random_uuid(), parent_id uuid references public.locations(id) on delete restrict,
  level text not null check(level in ('state','city','area','estate')),
  name text not null check(char_length(name) between 2 and 80), slug text not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_active boolean not null default true, sort_order int not null default 0, created_at timestamptz not null default now()
);
create unique index locations_parent_slug_uq on public.locations(coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),slug);
create table public.property_types (
  slug text primary key, label text not null, group_slug text not null check(group_slug in ('flat-apartment','house','land','commercial-property')),
  sort_order int not null default 0, is_active boolean not null default true
);
create table public.amenities (
  slug text primary key, label text not null, group_slug text not null check(group_slug in ('security','utilities','interior','compound','convenience')),
  sort_order int not null default 0, is_active boolean not null default true
);

insert into public.property_types(slug,label,group_slug,sort_order) values
 ('flat','Flat','flat-apartment',1),('mini_flat','Mini flat','flat-apartment',2),('self_contain','Self contain','flat-apartment',3),('studio_apartment','Studio apartment','flat-apartment',4),('shared_apartment','Shared apartment','flat-apartment',5),('penthouse','Penthouse','flat-apartment',6),('boys_quarters','Boys quarters','flat-apartment',7),
 ('detached_duplex','Detached duplex','house',10),('semi_detached_duplex','Semi-detached duplex','house',11),('terraced_duplex','Terraced duplex','house',12),('detached_bungalow','Detached bungalow','house',13),('semi_detached_bungalow','Semi-detached bungalow','house',14),('terraced_bungalow','Terraced bungalow','house',15),('block_of_flats','Block of flats','house',16),('other_house','Other house','house',17),
 ('residential_land','Residential land','land',20),('commercial_land','Commercial land','land',21),('mixed_use_land','Mixed-use land','land',22),('agricultural_land','Agricultural land','land',23),
 ('office_space','Office space','commercial-property',30),('co_working_space','Co-working space','commercial-property',31),('shop','Shop','commercial-property',32),('shop_in_mall','Shop in a mall','commercial-property',33),('warehouse','Warehouse','commercial-property',34),('other_commercial','Other commercial','commercial-property',35)
on conflict(slug) do nothing;
insert into public.amenities(slug,label,group_slug,sort_order) values
 ('gated_estate','Gated estate','security',1),('security_24h','24-hour security','security',2),('cctv','CCTV','security',3),('security_doors','Security doors','security',4),('perimeter_fence','Perimeter fence','security',5),
 ('prepaid_meter','Prepaid meter','utilities',10),('standby_generator','Standby generator','utilities',11),('solar_inverter','Solar/inverter','utilities',12),('borehole_water','Borehole water','utilities',13),('water_treatment','Water treatment','utilities',14),('fast_internet','Fast internet','utilities',15),('street_lights','Street lights','utilities',16),('drainage_system','Drainage system','utilities',17),
 ('all_rooms_ensuite','All rooms en-suite','interior',20),('pop_ceiling','POP ceiling','interior',21),('fitted_kitchen','Fitted kitchen','interior',22),('fitted_wardrobes','Fitted wardrobes','interior',23),('fitted_ac','Fitted AC','interior',24),('tiled_floors','Tiled floors','interior',25),('balcony','Balcony','interior',26),
 ('big_compound','Big compound','compound',30),('swimming_pool','Swimming pool','compound',31),('gym','Gym','compound',32),('elevator','Elevator','compound',33),('boys_quarters','Boys quarters','compound',34),('garden','Garden','compound',35),('parking_space','Parking space','compound',36),
 ('supermarket_nearby','Supermarket nearby','convenience',40),('good_road_access','Good road access','convenience',41),('near_public_transport','Near public transport','convenience',42),('school_nearby','School nearby','convenience',43)
on conflict(slug) do nothing;

insert into public.locations(level,name,slug,sort_order) values('state','Lagos','lagos',1),('state','Abuja (FCT)','abuja-fct',2) on conflict do nothing;
insert into public.locations(parent_id,level,name,slug,sort_order)
select parent_state.id,'city',initcap(replace(v.slug,'-',' ')),v.slug,v.n from (values
 ('Lagos','lekki',1),('Lagos','ajah',2),('Lagos','ikoyi',3),('Lagos','victoria-island',4),('Lagos','ikeja',5),('Lagos','yaba',6),('Lagos','surulere',7),('Lagos','gbagada',8),('Lagos','maryland',9),('Lagos','ikorodu',10),('Lagos','ibeju-lekki',11),('Lagos','sangotedo',12),('Lagos','isolo',13),('Lagos','ogudu',14),('Lagos','ojodu',15),('Lagos','magodo-kosofe',16),('Lagos','epe',17),('Lagos','badagry',18),('Lagos','alimosho',19),('Lagos','oshodi',20),('Lagos','apapa',21),
 ('Abuja (FCT)','maitama',1),('Abuja (FCT)','asokoro',2),('Abuja (FCT)','wuse-2',3),('Abuja (FCT)','jabi',4),('Abuja (FCT)','gwarinpa',5),('Abuja (FCT)','life-camp',6),('Abuja (FCT)','katampe',7),('Abuja (FCT)','lokogoma',8),('Abuja (FCT)','lugbe',9),('Abuja (FCT)','kubwa',10),('Abuja (FCT)','guzape',11),('Abuja (FCT)','jahi',12),('Abuja (FCT)','utako',13)
) v(parent_name,slug,n) join public.locations parent_state on parent_state.level='state' and parent_state.name=v.parent_name on conflict do nothing;

alter table public.listings add column if not exists price_on_request boolean not null default false;
alter table public.listings add column if not exists location_id uuid references public.locations(id);
alter table public.listings add column if not exists location_path uuid[] not null default '{}';
alter table public.listings add column if not exists public_location_label text;
alter table public.listings add column if not exists featured_rank int;
alter table public.listings add column if not exists is_newly_built boolean not null default false;
alter table public.listings add column if not exists is_serviced boolean not null default false;
alter table public.listings add column if not exists realtor_inspected_at timestamptz;
alter table public.listings add column if not exists status_changed_at timestamptz not null default now();
alter table public.listings add column if not exists rented_at timestamptz;
alter table public.listings add column if not exists sold_at timestamptz;
alter table public.listings add column if not exists video_url text;
alter table public.listings add column if not exists virtual_tour_url text;
alter table public.listings add column if not exists fees_ack_at timestamptz;
alter table public.listings add column if not exists search_tsv tsvector generated always as (to_tsvector('simple'::regconfig, coalesce(title,'') || ' ' || coalesce(description,''))) stored;
do $$ declare constraint_row record; begin
 for constraint_row in select conname from pg_constraint where conrelid='public.listings'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%price_period%' loop
  execute format('alter table public.listings drop constraint %I',constraint_row.conname);
 end loop;
end $$;
alter table public.listings alter column price_period drop not null;
alter table public.listings drop column if exists sort_price;
alter table public.listings alter column price_period type text using price_period::text;
alter table public.listings add column sort_price numeric generated always as (case when price_amount is null then null when purpose='rent' and price_period='month' then price_amount*12 else price_amount end) stored;
update public.listings set price_on_request=true,price_amount=null,price_period=null where price_period='price_on_request';
update public.listings set price_on_request=true,price_amount=null,price_period=null where price_amount is null;
update public.listings set price_on_request=true,price_amount=null,price_period=null where price_amount<=0;
alter table public.listings add constraint listings_price_request_v3 check ((price_on_request and price_amount is null) or (not price_on_request and price_amount is not null and price_amount>0));
alter table public.listings add constraint listings_price_period_v3 check (price_period is null or (purpose='rent' and price_period in ('year','month')) or (purpose='short_let' and price_period='day') or (purpose='sale' and price_period='one_time'));
update public.listings set public_location_label=coalesce(public_location,concat_ws(', ',area,city,state));
create index if not exists listings_sort_price_idx on public.listings(purpose,sort_price) where status in ('published','under_offer');
create index if not exists listings_loc_gin on public.listings using gin(location_path);
create index if not exists listings_tsv_gin on public.listings using gin(search_tsv);

alter table public.listing_private add column if not exists owner_name text;
alter table public.listing_private add column if not exists owner_phone text;
alter table public.listing_private add column if not exists vin text;
alter table public.listing_private add column if not exists internal_notes text;
alter table public.listing_private add column if not exists document_notes text;
alter table public.listing_private add column if not exists updated_at timestamptz not null default now();
alter table public.property_details add column if not exists land_size numeric(12,2);
alter table public.property_details add column if not exists land_size_unit text;
alter table public.property_details add column if not exists building_size numeric(12,2);
alter table public.property_details add column if not exists building_size_unit text;
alter table public.property_details add column if not exists land_use text;
alter table public.property_details add column if not exists title_type text;
alter table public.property_details add column if not exists advance_rent_months smallint;
create or replace function public.jsonb_text_array(value jsonb) returns text[] language sql immutable set search_path='' as $$
 select coalesce(array_agg(item_value),'{}'::text[]) from jsonb_array_elements_text(coalesce(value,'[]'::jsonb)) as items(item_value)
$$;
alter table public.property_details alter column amenities drop default;
alter table public.property_details alter column amenities type text[] using public.jsonb_text_array(amenities);
alter table public.property_details alter column amenities set default '{}'::text[];
alter table public.vehicle_details add column if not exists customs_status text;
alter table public.vehicle_details add column if not exists registration_status text;
alter table public.vehicle_details add column if not exists previous_owners smallint;
alter table public.vehicle_details add column if not exists mileage_unit text;
alter table public.vehicle_details add column if not exists body_type text;
alter table public.vehicle_details add column if not exists engine_size text;

create table public.listing_fees (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 fee_type text not null check(fee_type in ('agency','agreement_legal','caution_deposit','service_charge','other')),
 label text, state text not null check(state in ('known','not_applicable','unknown')),
 amount numeric(16,2) check(amount is null or amount>=0), percent_of_rent numeric(5,2) check(percent_of_rent between 0 and 100),
 frequency text check(frequency in ('one_time','year','month')), refundable boolean, note text,
 check((state='known' and ((amount is not null)::int+(percent_of_rent is not null)::int)=1) or (state<>'known' and amount is null and percent_of_rent is null)),
 check(fee_type<>'other' or label is not null), check(state<>'known' or frequency is not null)
);
create unique index listing_fees_uq on public.listing_fees(listing_id,fee_type,coalesce(label,''));
create table public.listing_status_events (
 id bigint generated always as identity primary key, listing_id uuid not null references public.listings(id) on delete cascade,
 from_status text, to_status text not null, note text, changed_by uuid references auth.users(id), created_at timestamptz not null default now()
);
alter table public.listing_images add column if not exists thumb_path text;
alter table public.listing_images add column if not exists width int not null default 1600;
alter table public.listing_images add column if not exists height int not null default 1200;
alter table public.listing_images add column if not exists blur_data_url text;
create index if not exists listing_images_order_idx on public.listing_images(listing_id,sort_order);

alter table public.enquiries add column if not exists listing_reference_snapshot text;
alter table public.enquiries add column if not exists listing_title_snapshot text;
alter table public.enquiries add column if not exists request_type text not null default 'availability';
alter table public.enquiries add column if not exists phone_normalized text;
alter table public.enquiries add column if not exists preferred_inspection_at timestamptz;
alter table public.enquiries add column if not exists criteria jsonb;
alter table public.enquiries add column if not exists internal_note text;
alter table public.enquiries add column if not exists consent_version text not null default 'v1';
alter table public.enquiries add column if not exists source_path text;
alter table public.enquiries add column if not exists utm jsonb;
alter table public.enquiries add column if not exists ip_hash text;
alter table public.enquiries add column if not exists purge_after timestamptz not null default now()+interval '365 days';
create index if not exists enquiries_purge_idx on public.enquiries(purge_after);
create table public.listing_reports (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade,
 reason text not null check(reason in ('no_longer_available','incorrect_info','suspected_fraud','marketed_without_consent','offensive_content','other')),
 details text check(details is null or char_length(details)<=500), contact text,
 status text not null default 'open' check(status in ('open','reviewed','dismissed')), ip_hash text, created_at timestamptz not null default now()
);
create table public.contact_events (
 id bigint generated always as identity primary key, listing_id uuid references public.listings(id) on delete set null,
 event_type text not null check(event_type in ('whatsapp_click','call_click','form_submit','share_click')),
 source_path text, created_at timestamptz not null default now()
);
create index contact_events_listing_time on public.contact_events(listing_id,created_at desc);
create table public.rate_limits (key text not null, window_start timestamptz not null, hits int not null default 1, primary key(key,window_start));

create or replace function public.trg_listings_location_path() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.location_id is null then new.location_path='{}'; return new; end if;
 with recursive ancestors as (
   select l.id,l.parent_id,0 as depth from public.locations l where l.id=new.location_id
   union all select p.id,p.parent_id,a.depth+1 from public.locations p join ancestors a on a.parent_id=p.id
 ) select coalesce(array_agg(id order by depth desc),'{}'::uuid[]) into new.location_path from ancestors;
 return new;
end $$;
create trigger listings_location_path before insert or update of location_id on public.listings for each row execute function public.trg_listings_location_path();
create or replace function public.trg_validate_location_hierarchy() returns trigger language plpgsql set search_path='' as $$
declare parent_level text;
begin
 if new.level='state' and new.parent_id is not null then raise exception 'State location cannot have a parent'; end if;
 if new.level<>'state' then
   select level into parent_level from public.locations where id=new.parent_id;
   if (new.level='city' and parent_level<>'state') or (new.level='area' and parent_level<>'city') or
      (new.level='estate' and parent_level not in ('area','city')) or parent_level is null then raise exception 'Invalid location parent'; end if;
 end if;
 return new;
end $$;
create trigger locations_hierarchy before insert or update of level,parent_id on public.locations for each row execute function public.trg_validate_location_hierarchy();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin')
$$;
create or replace function public.listing_is_public(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.listings l where l.id=p_id and (l.status in ('published','under_offer') or (l.status in ('rented','sold') and l.status_changed_at>=now()-make_interval(days=>coalesce((select closed_listings_public_days from public.site_settings where id=true),90)))))
$$;
revoke all on function public.is_admin() from public;
revoke all on function public.listing_is_public(uuid) from public;
grant execute on function public.is_admin(),public.listing_is_public(uuid) to anon,authenticated;

alter table public.site_settings enable row level security;
alter table public.locations enable row level security;
alter table public.property_types enable row level security;
alter table public.amenities enable row level security;
alter table public.listing_fees enable row level security;
alter table public.listing_status_events enable row level security;
alter table public.listing_reports enable row level security;
alter table public.contact_events enable row level security;
alter table public.rate_limits enable row level security;
alter table public.listing_private enable row level security;
drop policy if exists "Anonymous may submit an enquiry" on public.enquiries;
drop policy if exists "Admin manages enquiries" on public.enquiries;
drop policy if exists "Admin manages private addresses" on public.listing_private;
drop policy if exists "Public reads published listings" on public.listings;
drop policy if exists "Public reads published property details" on public.property_details;
drop policy if exists "Public reads published vehicle details" on public.vehicle_details;
drop policy if exists "Public reads published listing images" on public.listing_images;
create policy listings_public_read_v3 on public.listings for select to anon,authenticated using(status in ('published','under_offer') or (status in ('rented','sold') and status_changed_at>=now()-make_interval(days=>coalesce((select closed_listings_public_days from public.site_settings where id=true),90))));
create policy property_public_read_v3 on public.property_details for select to anon,authenticated using(public.listing_is_public(listing_id));
create policy vehicle_public_read_v3 on public.vehicle_details for select to anon,authenticated using(public.listing_is_public(listing_id));
create policy images_public_read_v3 on public.listing_images for select to anon,authenticated using(public.listing_is_public(listing_id));
create policy site_settings_public_read on public.site_settings for select to anon using(true);
create policy site_settings_admin_read on public.site_settings for select to authenticated using((select public.is_admin()));
create policy site_settings_admin_update on public.site_settings for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy locations_public_read on public.locations for select to anon,authenticated using(is_active);
create policy locations_admin_all on public.locations for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy property_types_public_read on public.property_types for select to anon,authenticated using(is_active);
create policy property_types_admin_all on public.property_types for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy amenities_public_read on public.amenities for select to anon,authenticated using(is_active);
create policy amenities_admin_all on public.amenities for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy listing_fees_public_read on public.listing_fees for select to anon,authenticated using(public.listing_is_public(listing_id));
create policy listing_fees_admin_all on public.listing_fees for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy status_events_admin_all on public.listing_status_events for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy reports_admin_all on public.listing_reports for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy contact_events_admin_all on public.contact_events for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy rate_limits_admin_all on public.rate_limits for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy private_admin_all_v3 on public.listing_private for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy enquiries_admin_all_v3 on public.enquiries for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

revoke all on public.site_settings,public.locations,public.property_types,public.amenities,public.listing_fees,public.listing_status_events,public.listing_reports,public.contact_events,public.rate_limits from anon,authenticated;
grant select on public.locations,public.property_types,public.amenities to anon,authenticated;
grant select on public.listing_fees to anon,authenticated;
grant select(brand_name,tagline,logo_path,realtor_name,realtor_bio,realtor_photo_path,credentials_text,whatsapp_number,phone,email,office_address_public,short_let_enabled,cars_enabled,show_exact_address,stale_after_days,auto_hide_stale,closed_listings_public_days,enquiry_retention_days,privacy_contact_email,safety_tips,social,updated_at) on public.site_settings to anon,authenticated;
grant select(id) on public.site_settings to anon,authenticated;
grant select(enquiry_retention_days) on public.site_settings to authenticated;
grant update on public.site_settings to authenticated;
grant select,insert,update,delete on public.locations,public.property_types,public.amenities,public.listing_fees,public.listing_private,public.listing_status_events,public.listing_reports,public.contact_events,public.rate_limits,public.enquiries to authenticated;
grant usage,select on all sequences in schema public to authenticated;
revoke all on public.enquiries,public.listing_reports,public.contact_events,public.rate_limits from anon;

create or replace function public.rl_hit(p_key text,p_window_seconds int,p_max int) returns boolean
language plpgsql security definer set search_path='' as $$
declare allowed boolean;
begin
 insert into public.rate_limits(key,window_start,hits) values(p_key,to_timestamp(floor(extract(epoch from now())/greatest(p_window_seconds,1))*greatest(p_window_seconds,1)),1)
 on conflict(key,window_start) do update set hits=public.rate_limits.hits+1 returning hits<=p_max into allowed;
 return coalesce(allowed,false);
end $$;
revoke all on function public.rl_hit(text,int,int) from public,anon,authenticated;
grant execute on function public.rl_hit(text,int,int) to service_role;

create or replace function public.purge_expired_enquiries(p_dry_run boolean default true) returns bigint
language plpgsql security definer set search_path='' as $$
declare affected bigint;
begin
 if not (select public.is_admin()) and coalesce((select auth.role()),'')<>'service_role' then raise exception 'Forbidden'; end if;
 if p_dry_run then select count(*) into affected from public.enquiries where purge_after<=now();
 else delete from public.enquiries where purge_after<=now(); get diagnostics affected=row_count; end if;
 return affected;
end $$;
revoke all on function public.purge_expired_enquiries(boolean) from public,anon;
grant execute on function public.purge_expired_enquiries(boolean) to service_role,authenticated;

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
   select * into listing from public.listings where reference_code=p->>'listing_reference' and status in ('published','under_offer');
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
 select id into listing_id_value from public.listings where reference_code=p->>'listing_reference' and status in ('published','under_offer');
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
 select id,p_event,left(p_source_path,500) from public.listings where reference_code=p_listing_ref and status in ('published','under_offer');
end $$;
revoke all on function public.log_contact_event(text,text,text,text) from public,anon,authenticated;
grant execute on function public.log_contact_event(text,text,text,text) to service_role;

-- Public URLs never receive privileged settings or private listing rows.
create or replace function public.search_properties(p_purpose text,p_group text default null,p_type text default null,p_location_id uuid default null,p_estate_id uuid default null,p_bedrooms int default null,p_bathrooms_min int default null,p_min_price numeric default null,p_max_price numeric default null,p_furnishing text[] default null,p_amenities text[] default null,p_is_new boolean default null,p_is_serviced boolean default null,p_q text default null,p_sort text default 'newest',p_limit int default 12,p_offset int default 0)
returns table(id uuid,reference_code text,title text,purpose text,status text,price_amount numeric,price_period text,price_on_request boolean,negotiable boolean,currency text,location_path uuid[],public_location_label text,property_type text,bedrooms smallint,bathrooms smallint,toilets smallint,furnishing text,amenities text[],cover_thumb text,cover_blur text,image_count int,published_at timestamptz,last_confirmed_at timestamptz,is_newly_built boolean,is_serviced boolean,total_count bigint)
language sql stable security invoker set search_path='' as $$
 with candidates as (
  select l.id,l.reference_code,l.title,l.purpose::text purpose,l.status::text status,l.price_amount,l.price_period::text price_period,l.price_on_request,l.negotiable,l.currency::text currency,l.location_path,l.public_location_label,p.property_type,p.bedrooms,p.bathrooms,p.toilets,p.furnishing,p.amenities,
   (select i.thumb_path from public.listing_images i where i.listing_id=l.id order by i.is_cover desc,i.sort_order limit 1) cover_thumb,
   (select i.blur_data_url from public.listing_images i where i.listing_id=l.id order by i.is_cover desc,i.sort_order limit 1) cover_blur,
   (select count(*)::int from public.listing_images i where i.listing_id=l.id) image_count,l.published_at,l.last_confirmed_at,l.is_newly_built,l.is_serviced,l.sort_price
  from public.listings l join public.property_details p on p.listing_id=l.id join public.property_types t on t.slug=p.property_type
  where l.category='property' and l.purpose::text=p_purpose and l.status in ('published','under_offer') and (p_group is null or t.group_slug=p_group) and (p_type is null or p.property_type=p_type)
   and (p_location_id is null or l.location_path @> array[p_location_id]) and (p_estate_id is null or l.location_path @> array[p_estate_id])
   and (p_bedrooms is null or (p_bedrooms=5 and p.bedrooms>=5) or p.bedrooms=p_bedrooms) and (p_bathrooms_min is null or p.bathrooms>=p_bathrooms_min)
   and (p_min_price is null or l.sort_price>=p_min_price) and (p_max_price is null or l.sort_price<=p_max_price)
   and (p_furnishing is null or p.furnishing=any(p_furnishing)) and (p_amenities is null or p.amenities @> p_amenities)
   and (p_is_new is null or l.is_newly_built=p_is_new) and (p_is_serviced is null or l.is_serviced=p_is_serviced)
   and (p_q is null or l.search_tsv @@ plainto_tsquery('simple',left(p_q,80)))
   and (not coalesce((select auto_hide_stale from public.site_settings where id=true),false) or l.last_confirmed_at>=now()-make_interval(days=>coalesce((select stale_after_days from public.site_settings where id=true),14)))
 ), counted as (select c.*,count(*) over() total_count from candidates c)
 select c.id,c.reference_code,c.title,c.purpose,c.status,c.price_amount,c.price_period,c.price_on_request,c.negotiable,c.currency,c.location_path,c.public_location_label,c.property_type,c.bedrooms,c.bathrooms,c.toilets,c.furnishing,c.amenities,c.cover_thumb,c.cover_blur,c.image_count,c.published_at,c.last_confirmed_at,c.is_newly_built,c.is_serviced,c.total_count
 from counted c order by case when p_sort='price_asc' then c.sort_price end asc nulls last,case when p_sort='price_desc' then c.sort_price end desc nulls last,case when p_sort='beds_desc' then c.bedrooms end desc nulls last,c.published_at desc,c.id limit greatest(1,least(coalesce(p_limit,12),48)) offset greatest(0,coalesce(p_offset,0))
$$;
revoke all on function public.search_properties(text,text,text,uuid,uuid,int,int,numeric,numeric,text[],text[],boolean,boolean,text,text,int,int) from public;
grant execute on function public.search_properties(text,text,text,uuid,uuid,int,int,numeric,numeric,text[],text[],boolean,boolean,text,text,int,int) to anon,authenticated;

create or replace function public.property_facets(p_purpose text,p_location_id uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $$
 with base as (select l.id,l.sort_price,p.property_type,p.bedrooms,l.location_path,l.published_at from public.listings l join public.property_details p on p.listing_id=l.id where l.category='property' and l.purpose::text=p_purpose and l.status in ('published','under_offer') and (p_location_id is null or l.location_path @> array[p_location_id])),
 types as (select jsonb_agg(jsonb_build_object('slug',property_type,'count',n) order by property_type) items from (select property_type,count(*) n from base group by property_type) x),
 beds as (select jsonb_agg(jsonb_build_object('n',beds,'count',n) order by beds) items from (select case when bedrooms>=5 then 5 else bedrooms end beds,count(*) n from base where bedrooms is not null group by 1) x)
 select jsonb_build_object('types',coalesce((select items from types),'[]'::jsonb),'bedrooms',coalesce((select items from beds),'[]'::jsonb),'total',(select count(*) from base),'priceMin',(select min(sort_price) from base),'priceMax',(select max(sort_price) from base),'updatedAt',(select max(published_at) from base))
$$;
grant execute on function public.property_facets(text,uuid) to anon,authenticated;
revoke all on function public.property_facets(text,uuid) from public;

create or replace function public.search_cars(p_make text default null,p_model text default null,p_min_year int default null,p_max_year int default null,p_min_price numeric default null,p_max_price numeric default null,p_location_id uuid default null,p_import_status text default null,p_condition text default null,p_transmission text default null,p_fuel_type text default null,p_sort text default 'newest',p_limit int default 12,p_offset int default 0)
returns table(id uuid,reference_code text,title text,status text,price_amount numeric,price_period text,price_on_request boolean,negotiable boolean,currency text,location_path uuid[],public_location_label text,make text,model text,year smallint,mileage int,mileage_unit text,condition text,import_status text,transmission text,fuel_type text,cover_thumb text,cover_blur text,image_count int,published_at timestamptz,last_confirmed_at timestamptz,total_count bigint)
language sql stable security invoker set search_path='' as $$
 with candidates as (
  select l.id,l.reference_code,l.title,l.status::text status,l.price_amount,l.price_period::text price_period,l.price_on_request,l.negotiable,l.currency::text currency,l.location_path,l.public_location_label,v.make,v.model,v.year,v.mileage,v.mileage_unit,v.condition,v.import_status,v.transmission,v.fuel_type,
   (select i.thumb_path from public.listing_images i where i.listing_id=l.id order by i.is_cover desc,i.sort_order limit 1) cover_thumb,
   (select i.blur_data_url from public.listing_images i where i.listing_id=l.id order by i.is_cover desc,i.sort_order limit 1) cover_blur,
   (select count(*)::int from public.listing_images i where i.listing_id=l.id) image_count,l.published_at,l.last_confirmed_at,l.sort_price
  from public.listings l join public.vehicle_details v on v.listing_id=l.id
  where l.category='vehicle' and l.purpose='sale' and l.status in ('published','under_offer')
   and (p_make is null or v.make ilike '%'||left(p_make,60)||'%') and (p_model is null or v.model ilike '%'||left(p_model,60)||'%')
   and (p_min_year is null or v.year>=p_min_year) and (p_max_year is null or v.year<=p_max_year)
   and (p_min_price is null or l.sort_price>=p_min_price) and (p_max_price is null or l.sort_price<=p_max_price)
   and (p_location_id is null or l.location_path @> array[p_location_id]) and (p_import_status is null or v.import_status=p_import_status)
   and (p_condition is null or v.condition=p_condition) and (p_transmission is null or v.transmission=p_transmission) and (p_fuel_type is null or v.fuel_type=p_fuel_type)
   and (not coalesce((select auto_hide_stale from public.site_settings where id=true),false) or l.last_confirmed_at>=now()-make_interval(days=>coalesce((select stale_after_days from public.site_settings where id=true),14)))
 ), counted as (select c.*,count(*) over() total_count from candidates c)
 select c.id,c.reference_code,c.title,c.status,c.price_amount,c.price_period,c.price_on_request,c.negotiable,c.currency,c.location_path,c.public_location_label,c.make,c.model,c.year,c.mileage,c.mileage_unit,c.condition,c.import_status,c.transmission,c.fuel_type,c.cover_thumb,c.cover_blur,c.image_count,c.published_at,c.last_confirmed_at,c.total_count
 from counted c order by case when p_sort='price_asc' then c.sort_price end asc nulls last,case when p_sort='price_desc' then c.sort_price end desc nulls last,case when p_sort='year_desc' then c.year end desc nulls last,c.published_at desc,c.id
 limit greatest(1,least(coalesce(p_limit,12),48)) offset greatest(0,coalesce(p_offset,0))
$$;
revoke all on function public.search_cars(text,text,int,int,numeric,numeric,uuid,text,text,text,text,text,int,int) from public;
grant execute on function public.search_cars(text,text,int,int,numeric,numeric,uuid,text,text,text,text,text,int,int) to anon,authenticated;

create or replace function public.publish_readiness(p_listing_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare l public.listings%rowtype; d public.property_details%rowtype; v public.vehicle_details%rowtype; issue_list jsonb:='[]'::jsonb; image_count int; cover_count int; cover_alt text; location_depth int;
begin
 select * into l from public.listings where id=p_listing_id;
 if not found then return jsonb_build_object('ready',false,'issues',jsonb_build_array(jsonb_build_object('code','listing_missing','field','listing','message','Listing was not found.'))); end if;
 if char_length(trim(l.title))<10 then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','title_short','field','title','message','Use a title with at least 10 characters.')); end if;
 if char_length(trim(l.description))<80 then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','description_short','field','description','message','Add at least 80 characters of accurate description.')); end if;
 if not l.price_on_request and (l.price_amount is null or l.price_period is null) then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','price_required','field','price_amount','message','Add a price and period or mark price on request.')); end if;
 select cardinality(location_path) into location_depth from public.listings where id=p_listing_id;
 if coalesce(location_depth,0)<2 then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','location_required','field','location_id','message','Choose at least a city.')); end if;
 select count(*),count(*) filter(where is_cover),max(alt_text) filter(where is_cover) into image_count,cover_count,cover_alt from public.listing_images where listing_id=p_listing_id;
 if image_count<3 then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','photos_minimum','field','images','message','Add at least 3 photos.')); end if;
 if cover_count<>1 or coalesce(trim(cover_alt),'')='' then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','cover_required','field','images','message','Set one cover photo with accurate alt text.')); end if;
 if l.category='property' then
  select * into d from public.property_details where listing_id=p_listing_id;
  if not found then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','property_details','field','property_type','message','Add property details.'));
  else
   if d.bedrooms is null and not exists(select 1 from public.property_types where slug=d.property_type and group_slug in ('land','commercial-property')) then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','bedrooms_required','field','bedrooms','message','Add bedroom count for this property type.')); end if;
  end if;
 else
  select * into v from public.vehicle_details where listing_id=p_listing_id;
  if not found or v.make is null or v.model is null or v.year is null or v.mileage is null or v.mileage_unit is null or v.condition is null or v.import_status is null then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','vehicle_details','field','vehicle','message','Complete make, model, year, mileage, condition and import status.')); end if;
 end if;
 if l.last_confirmed_at is null then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','confirmation_required','field','last_confirmed_at','message','Confirm availability before publishing.')); end if;
 if l.purpose in ('rent','short_let') and l.fees_ack_at is null then
  if exists(select 1 from (values('agency'),('agreement_legal'),('caution_deposit'),('service_charge')) req(fee_type) left join public.listing_fees f on f.listing_id=p_listing_id and f.fee_type=req.fee_type where f.id is null or f.state='unknown') then issue_list=issue_list||jsonb_build_array(jsonb_build_object('code','fee_unresolved','field','fees','message','Resolve required fees or acknowledge publishing with unknown fees.')); end if;
 end if;
 return jsonb_build_object('ready',jsonb_array_length(issue_list)=0,'issues',issue_list);
end $$;
revoke all on function public.publish_readiness(uuid) from public,anon,authenticated;
grant execute on function public.publish_readiness(uuid) to service_role;

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
  ready=public.publish_readiness(new.id);
  if not coalesce((ready->>'ready')::boolean,false) then raise exception 'Listing is not ready to publish: %',ready->'issues'; end if;
 end if;
 return new;
end $$;
create trigger listings_status_v3 before insert or update on public.listings for each row execute function public.trg_listings_status();

create or replace function public.admin_transition_listing(p_listing_id uuid,p_status text,p_note text default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_status text;
begin
 if not (select public.is_admin()) then return jsonb_build_object('ok',false,'code','FORBIDDEN'); end if;
 if p_status not in ('draft','published','under_offer','rented','sold','archived') then return jsonb_build_object('ok',false,'code','INVALID'); end if;
 perform set_config('app.relist_note',coalesce(nullif(trim(p_note),''),''),true);
 update public.listings set status=p_status::public.listing_status where id=p_listing_id returning status::text into current_status;
 if current_status is null then return jsonb_build_object('ok',false,'code','NOT_FOUND'); end if;
 return jsonb_build_object('ok',true,'status',current_status);
end $$;
revoke all on function public.admin_transition_listing(uuid,text,text) from public,anon;
grant execute on function public.admin_transition_listing(uuid,text,text) to authenticated;

create or replace function public.trg_property_amenities_valid() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from unnest(new.amenities) a where not exists(select 1 from public.amenities m where m.slug=a and m.is_active)) then raise exception 'Unknown or inactive amenity'; end if;
 return new;
end $$;
create trigger property_amenities_valid before insert or update of amenities on public.property_details for each row execute function public.trg_property_amenities_valid();

create or replace function public.trg_listing_media_hosts() returns trigger language plpgsql set search_path='' as $$
begin
 if new.video_url is not null and (split_part(regexp_replace(new.video_url,'^https?://',''), '/', 1) not in ('youtube.com','www.youtube.com','youtu.be','youtube-nocookie.com','www.youtube-nocookie.com','player.vimeo.com','my.matterport.com')) then raise exception 'Video host is not allowed'; end if;
 if new.virtual_tour_url is not null and (split_part(regexp_replace(new.virtual_tour_url,'^https?://',''), '/', 1) not in ('youtube.com','www.youtube.com','youtu.be','youtube-nocookie.com','www.youtube-nocookie.com','player.vimeo.com','my.matterport.com')) then raise exception 'Virtual tour host is not allowed'; end if;
 return new;
end $$;
create trigger listing_media_hosts before insert or update of video_url,virtual_tour_url on public.listings for each row execute function public.trg_listing_media_hosts();

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger listing_private_updated_at before update on public.listing_private for each row execute function public.set_updated_at();
create trigger enquiries_updated_at_v3 before update on public.enquiries for each row execute function public.set_updated_at();

-- Internal helpers and trigger procedures are not PostgREST RPC endpoints.
revoke all on function public.gen_reference_code(),public.jsonb_text_array(jsonb),
 public.trg_listings_location_path(),public.trg_validate_location_hierarchy(),public.trg_listings_status(),
 public.trg_property_amenities_valid(),public.trg_listing_media_hosts(),public.set_updated_at()
 from public,anon,authenticated;
grant execute on function public.gen_reference_code() to authenticated;

-- Private-media bucket; public reads are mediated by signed URLs from authorized server code.
update storage.buckets set public=false,file_size_limit=2097152,allowed_mime_types=array['image/webp','image/jpeg','image/png'] where id='listing-media';
drop policy if exists "Admin uploads listing media" on storage.objects;
drop policy if exists "Admin updates listing media" on storage.objects;
drop policy if exists "Admin deletes listing media" on storage.objects;
create policy admin_uploads_listing_media_v3 on storage.objects for insert to authenticated with check(bucket_id='listing-media' and (select public.is_admin()) and (storage.foldername(name))[1]='listings' and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$');
create policy admin_updates_listing_media_v3 on storage.objects for update to authenticated using(bucket_id='listing-media' and (select public.is_admin()) and ((storage.foldername(name))[1]='listings' or (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$')) with check(bucket_id='listing-media' and (select public.is_admin()) and ((storage.foldername(name))[1]='listings' or (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'));
create policy admin_deletes_listing_media_v3 on storage.objects for delete to authenticated using(bucket_id='listing-media' and (select public.is_admin()) and ((storage.foldername(name))[1]='listings' or (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'));
drop policy if exists "Public reads media for published listings" on storage.objects;
create policy public_reads_active_listing_media on storage.objects for select to anon,authenticated using(bucket_id='listing-media' and exists(select 1 from public.listings l where l.id::text=case when (storage.foldername(name))[1]='listings' then (storage.foldername(name))[2] else (storage.foldername(name))[1] end and public.listing_is_public(l.id)));
