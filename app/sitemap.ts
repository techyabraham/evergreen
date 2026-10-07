import type { MetadataRoute } from 'next';
import { getListings } from '@/lib/data';
import { propertySlug, slugPart } from '@/lib/domain/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const paths = ['', '/property-for-rent', '/property-for-sale', '/car-for-sale', '/request', '/recently-closed', '/safety', '/about', '/contact', '/privacy'];
  const fixed = paths.map(path => ({ url: `${base}${path}`, lastModified: new Date() }));
  const listings = [] as Awaited<ReturnType<typeof getListings>>;
  for (let offset = 0; offset < 48_000; offset += 48) {
    const batch = await getListings({}, 48, offset);
    listings.push(...batch);
    if (batch.length < 48) break;
  }
  return [...fixed, ...listings.map(item => ({
    url: `${base}${item.category === 'vehicle'
      ? `/car/${[item.vehicle_details?.make, item.vehicle_details?.model, item.vehicle_details?.year, item.city, item.reference_code].filter(Boolean).map(value => slugPart(String(value))).join('-')}`
      : `/property/${propertySlug({ title: item.title, referenceCode: item.reference_code, beds: item.property_details?.bedrooms, type: item.property_details?.property_type, purpose: item.purpose, area: item.area, city: item.city })}`}`,
    lastModified: new Date(item.updated_at),
  }))];
}
