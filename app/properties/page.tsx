import type { Metadata } from 'next';
import Link from 'next/link';
import { getListings, getPublicSettings } from '@/lib/data';
import { parseQuery } from '@/lib/domain/filters';
import { ListingCard } from '@/components/listing-card';
import { Pagination } from '@/components/pagination';
import type { Listing } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Properties for rent and sale',
  description: 'Search properties across Ibadan, Lagos and Abuja. Browse homes to rent, buy or short let.',
  alternates: { canonical: '/properties' },
};

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const safeText = (value: string | undefined, max: number) => value?.replace(/[%,_\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) || undefined;
const cities = [{ name: 'Ibadan', state: 'Oyo State' }, { name: 'Lagos', state: 'Lagos' }, { name: 'Abuja', state: 'Abuja (FCT)' }];

function PropertyCollection({ title, eyebrow, href, listings }: { title: string; eyebrow: string; href: string; listings: Listing[] }) {
  if (!listings.length) return null;
  return <section className="browse-collection" aria-label={title}>
    <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link href={href}>View all <span aria-hidden="true">↗</span></Link></div>
    <div className="cards">{listings.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>
  </section>;
}

export default async function Properties({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const parsed = parseQuery(raw).filters;
  const sort = parsed.sort || 'newest';
  const settings = await getPublicSettings();
  const shortLetEnabled = Boolean(settings?.short_let_enabled) || process.env.NEXT_PUBLIC_ENABLE_SHORT_LET === 'true';
  const rawPurpose = first(raw.purpose);
  const purpose = rawPurpose === 'rent' || rawPurpose === 'sale' || (rawPurpose === 'short_let' && shortLetEnabled) ? rawPurpose : undefined;
  const city = safeText(first(raw.city), 80);
  const area = safeText(first(raw.area), 100);
  const state = safeText(first(raw.state), 80);
  const featured = first(raw.featured) === 'true' ? 'true' : undefined;
  const page = parsed.page;
  const hasSearchCriteria = Boolean(purpose || parsed.q || city || area || state || parsed.minPrice !== undefined || parsed.maxPrice !== undefined || parsed.beds !== undefined || parsed.bathrooms !== undefined || parsed.furnishing || parsed.amenities.length || featured || first(raw.sort));
  const filters: Record<string, string | undefined> = {
    category: 'property', purpose, q: parsed.q,
    min: parsed.minPrice?.toString(), max: parsed.maxPrice?.toString(),
    bedrooms: parsed.beds?.toString(), bathrooms: parsed.bathrooms?.toString(),
    furnishing: parsed.furnishing, amenity: parsed.amenities[0], sort,
    city, area, state, featured,
  };
  const [rows, featuredListings, latest, cityListings] = await Promise.all([
    hasSearchCriteria ? getListings(filters, 25, (page - 1) * 24) : Promise.resolve([]),
    hasSearchCriteria ? Promise.resolve([]) : getListings({ category: 'property', featured: 'true' }, 6),
    hasSearchCriteria ? Promise.resolve([]) : getListings({ category: 'property' }, 6),
    hasSearchCriteria ? Promise.resolve([]) : Promise.all(cities.map(item => getListings({ category: 'property', city: item.name }, 3))),
  ]);
  const listings = rows.slice(0, 24);
  const hasMore = rows.length > 24;
  const selectedAmenity = parsed.amenities[0];
  const active = [
    purpose && { key: 'purpose', label: purpose === 'sale' ? 'For sale' : purpose === 'short_let' ? 'Short let' : 'For rent' },
    featured && { key: 'featured', label: 'Featured properties' },
    parsed.q && { key: 'q', label: `Search: ${parsed.q}` },
    city && { key: 'city', label: `City: ${city}` },
    area && { key: 'area', label: `Area: ${area}` },
    state && { key: 'state', label: `State: ${state}` },
    parsed.minPrice !== undefined && { key: 'minPrice', label: `From ₦${parsed.minPrice.toLocaleString('en-NG')}` },
    parsed.maxPrice !== undefined && { key: 'maxPrice', label: `Up to ₦${parsed.maxPrice.toLocaleString('en-NG')}` },
    parsed.beds !== undefined && { key: 'beds', label: `${parsed.beds}+ bedrooms` },
    parsed.bathrooms !== undefined && { key: 'bathrooms', label: `${parsed.bathrooms}+ bathrooms` },
    parsed.furnishing && { key: 'furnishing', label: parsed.furnishing.replaceAll('_', ' ') },
    selectedAmenity && { key: 'amenities', label: selectedAmenity.replaceAll('_', ' ') },
    sort !== 'newest' && { key: 'sort', label: `Sort: ${sort.replaceAll('_', ' ')}` },
  ].filter((item): item is { key: string; label: string } => Boolean(item));
  const remove = (key: string) => {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(raw)) {
      if (name === key || name === 'page') continue;
      for (const item of Array.isArray(value) ? value : [value]) if (item !== undefined) params.append(name, item);
    }
    const query = params.toString();
    return `/properties${query ? `?${query}` : ''}`;
  };

  return <section className="wrap property-results-page">
    <nav aria-label="Breadcrumb" className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Properties</span></nav>
    <header className="results-heading">
      <div><p className="eyebrow">The Evergreen property collection</p><h1>Find a home that feels right.</h1><p>Search homes to rent or buy across Ibadan, Lagos and Abuja. Listing details come from the realtor; confirm availability and fees before proceeding.</p></div>
      <Link className="results-heading-link" href="/request">Have something specific in mind? <span>Send a request ↗</span></Link>
    </header>
    <section className="property-filter-panel" aria-label="Property filters">
      <form method="GET" action="/properties" className="property-filter-form">
        <div className="property-filter-primary">
          <label className="filter-control filter-search"><span>Search homes</span><input name="q" type="search" defaultValue={parsed.q} placeholder="Area, property or feature"/></label>
          <label className="filter-control"><span>Looking to</span><select name="purpose" defaultValue={purpose||''}><option value="">Rent or buy</option><option value="rent">Rent</option><option value="sale">Buy</option>{shortLetEnabled&&<option value="short_let">Short let</option>}</select></label>
          <label className="filter-control"><span>City</span><input name="city" list="property-cities" defaultValue={city} placeholder="Any city"/><datalist id="property-cities"><option value="Ibadan"/><option value="Lagos"/><option value="Abuja"/></datalist></label>
          <label className="filter-control"><span>Maximum price <small>NGN</small></span><input name="maxPrice" type="number" min="0" inputMode="numeric" defaultValue={parsed.maxPrice}/></label>
        </div>
        <details className="filter-more" open={Boolean(parsed.minPrice||parsed.beds||parsed.bathrooms||parsed.furnishing||selectedAmenity||area||state||sort!=='newest')}>
          <summary>More filters <span>Budget, home details and location</span></summary>
          <div className="property-filter-secondary">
            <label className="filter-control"><span>Minimum price <small>NGN</small></span><input name="minPrice" type="number" min="0" inputMode="numeric" defaultValue={parsed.minPrice}/></label>
            <label className="filter-control"><span>Bedrooms</span><select name="beds" defaultValue={parsed.beds?.toString()||''}><option value="">Any</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option><option value="4">4 bedrooms</option><option value="5">5 or more</option></select></label>
            <label className="filter-control"><span>Bathrooms</span><select name="bathrooms" defaultValue={parsed.bathrooms?.toString()||''}><option value="">Any</option><option value="1">1 or more</option><option value="2">2 or more</option><option value="3">3 or more</option><option value="4">4 or more</option></select></label>
            <label className="filter-control"><span>Furnishing</span><select name="furnishing" defaultValue={parsed.furnishing||''}><option value="">Any</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label>
            <label className="filter-control"><span>Feature</span><select name="amenities" defaultValue={selectedAmenity||''}><option value="">Any feature</option><option value="parking_space">Parking</option><option value="standby_generator">Standby generator</option><option value="security_24h">24-hour security</option><option value="borehole_water">Borehole water</option><option value="swimming_pool">Swimming pool</option><option value="gym">Gym</option><option value="balcony">Balcony</option></select></label>
            <label className="filter-control"><span>Area or neighbourhood</span><input name="area" defaultValue={area} placeholder="For example, Bodija"/></label>
            <label className="filter-control"><span>State / FCT</span><input name="state" defaultValue={state} placeholder="Oyo, Lagos, Abuja (FCT)"/></label>
            <label className="filter-control"><span>Sort by</span><select name="sort" defaultValue={sort}><option value="newest">Most recent</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="beds_desc">Most bedrooms</option></select></label>
          </div>
        </details>
        <div className="filter-actions"><button className="button">Show properties <span aria-hidden="true">↗</span></button><Link href="/properties">Clear all filters</Link></div>
      </form>
    </section>
    {active.length>0&&<nav className="active-filter-list" aria-label="Applied filters"><span>Applied:</span>{active.map(item=><Link href={remove(item.key)} key={item.key} aria-label={`Remove ${item.label}`}>{item.label}<span aria-hidden="true"> ×</span></Link>)}<Link className="active-filter-clear" href="/properties">Clear all</Link></nav>}
    {hasSearchCriteria ? <>
      <div className="results-toolbar"><p>{listings.length?`${listings.length}${hasMore?'+':''} matching properties`:'No properties match your search.'}</p>{page>1&&<span>Page {page}</span>}</div>
      {listings.length?<><div className="cards">{listings.map(listing=><ListingCard key={listing.id} listing={listing}/>)}</div><Pagination path="/properties" filters={filters} page={page} hasMore={hasMore}/></>:<div className="empty-state property-empty"><span className="empty-spark" aria-hidden="true">⌂</span><p className="eyebrow">No homes found</p><h2>Let’s widen the search.</h2><p>Try a different city or adjust your filters. If you know what you need, send a request and the realtor can follow up.</p><Link className="button" href="/request">Make a property request <span aria-hidden="true">↗</span></Link></div>}
    </> : <div className="browse-collections">
      <p className="browse-intro">Browse the latest property listings across Ibadan, Lagos and Abuja. Use the search above when you are ready to narrow the results.</p>
      <PropertyCollection title="Featured properties" eyebrow="Selected by the realtor" href="/properties?featured=true" listings={featuredListings} />
      <PropertyCollection title="Recently listed" eyebrow="The latest additions" href="/properties?sort=newest" listings={latest.filter(listing => !featuredListings.some(item => item.id === listing.id))} />
      {cities.map((item, index) => <PropertyCollection key={item.name} title={`Properties in ${item.name}`} eyebrow={`${item.state} · Browse by location`} href={`/properties?city=${encodeURIComponent(item.name)}`} listings={cityListings[index]} />)}
      {!featuredListings.length && !latest.length && <div className="empty-state property-empty"><span className="empty-spark" aria-hidden="true">⌂</span><p className="eyebrow">Property listings</p><h2>New homes will appear here.</h2><p>Send a request and the realtor can follow up about properties that fit.</p><Link className="button" href="/request">Make a property request <span aria-hidden="true">↗</span></Link></div>}
    </div>}
  </section>;
}
