import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { formatPrice } from '@/lib/format';
export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.listing_images?.find((image) => image.is_cover) ?? listing.listing_images?.[0];
  const photo = cover?.url;
  return <article className="card"><Link className="card-image" href={`/${listing.category === 'vehicle' ? 'cars' : 'properties'}/${listing.slug}`} aria-label={`View ${listing.title}`}>
    {photo ? <Image src={photo} alt={cover?.alt_text || listing.title} loading="lazy" width={1200} height={800} sizes="(max-width: 560px) 100vw, (max-width: 850px) 50vw, 33vw" unoptimized /> : <div className="image-placeholder" aria-label="No listing photo yet">Property details<br />available on request</div>}
    <span className="reference">{listing.reference_code}</span></Link><div className="card-body"><p className="eyebrow">{[listing.public_location || listing.area, listing.city, listing.state].filter(Boolean).join(' · ') || 'Nigeria'}</p><h3><Link href={`/${listing.category === 'vehicle' ? 'cars' : 'properties'}/${listing.slug}`}>{listing.title}</Link></h3><p className="price">{formatPrice(listing.price_amount, listing.currency, listing.price_period)}</p><p className="facts">{listing.category === 'property' ? [listing.property_details?.property_type, listing.property_details?.bedrooms != null ? `${listing.property_details.bedrooms} beds` : null].filter(Boolean).join(' · ') : [listing.vehicle_details?.year, listing.vehicle_details?.make, listing.vehicle_details?.model].filter(Boolean).join(' · ')}</p></div></article>;
}
