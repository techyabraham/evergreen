import Link from 'next/link';
import Image from 'next/image';
import type {Listing} from '@/lib/types';
import {formatPrice,annualEquivalent} from '@/lib/domain/money';
import {formatNaira} from '@/lib/domain/money';
import {propertySlug,slugPart} from '@/lib/domain/slug';
import {freshness} from '@/lib/domain/freshness';

export function listingHref(listing:Listing){
 if(listing.category==='vehicle'){const vehicle=listing.vehicle_details;const slug=[vehicle?.make,vehicle?.model,vehicle?.year,listing.city,listing.reference_code].filter(Boolean).map(value=>slugPart(String(value))).join('-');return `/car/${slug}`;}
 const slug=propertySlug({title:listing.title,referenceCode:listing.reference_code,beds:listing.property_details?.bedrooms,type:listing.property_details?.property_type,purpose:listing.purpose,area:listing.area,city:listing.city});return `/property/${slug}`;
}
export function ListingCard({listing,priority=false}:{listing:Listing;priority?:boolean}){
 const cover=listing.listing_images?.find(image=>image.is_cover)??listing.listing_images?.[0];const photo=cover?.url;const href=listingHref(listing);const location=[listing.public_location_label||listing.public_location||listing.area,listing.city,listing.state].filter(Boolean).join(' · ')||'Nigeria';
 const price=formatPrice({amount:listing.price_amount==null?null:Number(listing.price_amount),period:listing.price_period as 'year'|'month'|'day'|'one_time'|null,onRequest:listing.price_on_request,purpose:listing.purpose});
 const confirmed=freshness({lastConfirmedAt:listing.last_confirmed_at,staleAfterDays:14});const status=listing.status==='under_offer'?'Under offer':listing.status==='rented'?'Rented':listing.status==='sold'?'Sold':null;
 return <article className="card"><Link className="card-image" href={href} aria-label={`View ${listing.title}`}>
  {photo?<Image src={photo} alt={cover?.alt_text||listing.title} loading={priority?'eager':'lazy'} priority={priority} width={cover?.width||1200} height={cover?.height||800} sizes="(max-width: 560px) 100vw, (max-width: 850px) 50vw, 33vw" unoptimized/>:<div className="image-placeholder" aria-label="No listing photo yet">Photos<br/>available on request</div>}
  <span className="reference">{listing.reference_code}</span>{status&&<span className="status-chip">{status}</span>}
  {listing.listing_images&&listing.listing_images.length>1&&<span className="photo-count" aria-label={`${listing.listing_images.length} photos`}>{listing.listing_images.length} photos</span>}
 </Link><div className="card-body"><p className="eyebrow">{location}</p><h3><Link href={href}>{listing.title}</Link></h3><p className="price">{price}{listing.negotiable&&<span className="negotiable-chip">Negotiable</span>}</p>
  {listing.purpose==='rent'&&listing.price_period==='month'&&listing.price_amount!==null&&<p className="annual-equivalent">≈ {formatNaira(annualEquivalent(Number(listing.price_amount),'month'))} / year</p>}
  <p className="facts">{listing.category==='property'?[listing.property_details?.property_type?.replaceAll('_',' '),listing.property_details?.bedrooms!=null?`${listing.property_details.bedrooms} bedrooms`:null,listing.property_details?.bathrooms!=null?`${listing.property_details.bathrooms} bathrooms`:null].filter(Boolean).join(' · '):[listing.vehicle_details?.year,listing.vehicle_details?.make,listing.vehicle_details?.model].filter(Boolean).join(' · ')}</p>
  {confirmed.kind==='fresh'&&<p className="freshness-badge">Confirmed {confirmed.days===0?'today':`${confirmed.days} day${confirmed.days===1?'':'s'} ago`}</p>}{confirmed.kind==='stale'&&<p className="stale-badge">Availability not recently confirmed</p>}
 </div></article>;
}
