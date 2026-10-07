create extension if not exists pgcrypto;

create type public.listing_category as enum ('property','vehicle');
create type public.listing_purpose as enum ('rent','sale','short_let');
create type public.listing_status as enum ('draft','published','under_offer','rented','sold','archived','unavailable');
create type public.enquiry_status as enum ('new','contacted','inspection_arranged','closed','spam');
create type public.preferred_contact as enum ('phone','email','whatsapp');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  whatsapp_number text,
  email text,
  bio text,
  avatar_path text,
  service_areas jsonb not null default '[]'::jsonb,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  reference_code text not null unique,
  category public.listing_category not null,
  purpose public.listing_purpose not null,
  title text not null check (length(title) between 5 and 140),
  description text not null default '',
  price_amount numeric(16,2) check (price_amount is null or price_amount >= 0),
  currency char(3) not null default 'NGN',
  price_period text not null check (price_period in ('year','month','day','one_time','price_on_request')),
  negotiable boolean not null default false,
  state text,
  city text,
  area text,
  public_location text,
  status public.listing_status not null default 'draft',
  featured boolean not null default false,
  available_from date,
  last_confirmed_at timestamptz,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((category = 'vehicle' and purpose = 'sale') or (category = 'property' and purpose in ('rent','sale','short_let'))),
  check ((price_period = 'price_on_request' and price_amount is null) or (price_period <> 'price_on_request' and price_amount is not null))
);
create index listings_public_order_idx on public.listings(status,category,purpose,published_at desc);
create index listings_location_idx on public.listings(state,city,area);
create index listings_price_idx on public.listings(price_amount);

create table public.listing_private (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  exact_address text,
  show_exact_address boolean not null default false
);
create table public.property_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  property_type text not null,
  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  bathrooms smallint check (bathrooms is null or bathrooms >= 0),
  toilets smallint check (toilets is null or toilets >= 0),
  furnishing text,
  parking_spaces smallint check (parking_spaces is null or parking_spaces >= 0),
  area_amount numeric(12,2) check (area_amount is null or area_amount >= 0),
  area_unit text,
  rent_payment_frequency text,
  agent_fee numeric(16,2) check (agent_fee is null or agent_fee >= 0),
  agreement_fee numeric(16,2) check (agreement_fee is null or agreement_fee >= 0),
  legal_fee numeric(16,2) check (legal_fee is null or legal_fee >= 0),
  caution_fee numeric(16,2) check (caution_fee is null or caution_fee >= 0),
  service_charge numeric(16,2) check (service_charge is null or service_charge >= 0),
  amenities jsonb not null default '[]'::jsonb
);
create table public.vehicle_details (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  make text not null,
  model text not null,
  trim text,
  year smallint check (year is null or year between 1900 and 2100),
  mileage integer check (mileage is null or mileage >= 0),
  mileage_unit text,
  condition text,
  import_status text,
  transmission text,
  fuel_type text,
  body_type text,
  engine_size text,
  colour text,
  known_issues text
);
create index property_details_beds_idx on public.property_details(bedrooms);
create index vehicle_details_make_year_idx on public.vehicle_details(make,year);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index listing_single_cover_idx on public.listing_images(listing_id) where is_cover;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  name text not null check (length(name) between 2 and 100),
  phone text check (phone is null or length(phone) <= 32),
  email text check (email is null or (length(email) <= 254 and position('@' in email) > 1)),
  message text not null check (length(message) between 5 and 2000),
  preferred_contact public.preferred_contact not null,
  status public.enquiry_status not null default 'new',
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index enquiries_recent_idx on public.enquiries(created_at desc);
create index enquiries_status_recent_idx on public.enquiries(status,created_at desc);

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create function public.enforce_listing_subtype() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' then
    if new.category = 'property' and not exists (select 1 from public.property_details d where d.listing_id = new.id) then
      raise exception 'Published properties require property details';
    end if;
    if new.category = 'property' and exists (select 1 from public.vehicle_details d where d.listing_id = new.id) then
      raise exception 'A property cannot have vehicle details';
    end if;
    if new.category = 'vehicle' and not exists (select 1 from public.vehicle_details d where d.listing_id = new.id) then
      raise exception 'Published vehicles require vehicle details';
    end if;
    if new.category = 'vehicle' and exists (select 1 from public.property_details d where d.listing_id = new.id) then
      raise exception 'A vehicle cannot have property details';
    end if;
  end if;
  return new;
end $$;
create trigger listing_subtype_before_publish before insert or update on public.listings for each row execute function public.enforce_listing_subtype();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_private enable row level security;
alter table public.property_details enable row level security;
alter table public.vehicle_details enable row level security;
alter table public.listing_images enable row level security;
alter table public.enquiries enable row level security;

create policy "Admin manages profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published listings" on public.listings for select to anon,authenticated using (status = 'published');
create policy "Admin manages listings" on public.listings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin manages private addresses" on public.listing_private for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published property details" on public.property_details for select to anon,authenticated using (exists(select 1 from public.listings l where l.id=listing_id and l.status='published' and l.category='property'));
create policy "Admin manages property details" on public.property_details for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published vehicle details" on public.vehicle_details for select to anon,authenticated using (exists(select 1 from public.listings l where l.id=listing_id and l.status='published' and l.category='vehicle'));
create policy "Admin manages vehicle details" on public.vehicle_details for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published listing images" on public.listing_images for select to anon,authenticated using (exists(select 1 from public.listings l where l.id=listing_id and l.status='published'));
create policy "Admin manages listing images" on public.listing_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Anonymous may submit an enquiry" on public.enquiries for insert to anon,authenticated with check (status='new' and consent_at <= now() and consent_at > now()-interval '1 day' and (listing_id is null or exists(select 1 from public.listings l where l.id=listing_id and l.status='published')));
create policy "Admin manages enquiries" on public.enquiries for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.listings,public.property_details,public.vehicle_details,public.listing_images to anon,authenticated;
grant insert on public.enquiries to anon,authenticated;
grant select,insert,update,delete on public.profiles,public.listing_private,public.property_details,public.vehicle_details,public.listing_images,public.listings,public.enquiries to authenticated;
grant usage,select on all sequences in schema public to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('listing-media','listing-media',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "Admin uploads listing media" on storage.objects for insert to authenticated with check (bucket_id='listing-media' and public.is_admin() and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$');
create policy "Admin updates listing media" on storage.objects for update to authenticated using (bucket_id='listing-media' and public.is_admin()) with check (bucket_id='listing-media' and public.is_admin());
create policy "Admin deletes listing media" on storage.objects for delete to authenticated using (bucket_id='listing-media' and public.is_admin());
create policy "Public reads media for published listings" on storage.objects for select to anon,authenticated using (
  bucket_id='listing-media' and exists (
    select 1 from public.listings l where l.id::text=(storage.foldername(name))[1] and l.status='published'
  )
);
create policy "Admin reads all listing media" on storage.objects for select to authenticated using (bucket_id='listing-media' and public.is_admin());
