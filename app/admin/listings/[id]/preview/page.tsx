import {requireAdmin} from '@/lib/security/require-admin';
import {isDemoReference,resolveListingImageUrls} from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {formatPrice} from '@/lib/format';
import type {ListingImage} from '@/lib/types';

export default async function Preview({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const {supabase:db}=await requireAdmin();
 const {data}=await db.from('listings').select('*,property_details(*),vehicle_details(*),listing_images(*)').eq('id',id).maybeSingle();
 if(!data)notFound();
 const photos=(data.listing_images??[]) as ListingImage[];
 const imageUrls=await resolveListingImageUrls(db,photos);
 const location=[data.public_location||data.area,data.city,data.state].filter(Boolean).join(', ')||'Nigeria';
 return <article className="wrap detail">
  <div className="notice">Private preview · Status: {data.status}. Only you can see this page.</div>
  {isDemoReference(data.reference_code)&&<div className="notice demo-notice"><strong>Demonstration only.</strong> This fictional sample is not a real property. Images are illustrative stock photos.</div>}
  <p className="eyebrow">{data.reference_code} · {data.purpose.replace('_',' ')}</p>
  <div className="detail-top"><div><h1>{data.title}</h1><p className="detail-place">{location}</p></div><p className="detail-price">{isDemoReference(data.reference_code)?'Illustrative demo':formatPrice(data.price_amount,data.currency,data.price_period)}</p></div>
  <div className="gallery">{photos.length?photos.slice(0,5).map((photo,index)=>{const src=imageUrls.get(photo.id);return <div className="gallery-image" key={photo.id}>{src&&<Image src={src} alt={photo.alt_text||data.title} width={photo.width||1400} height={photo.height||900} sizes="(max-width: 600px) 100vw, 70vw" unoptimized loading={index===0?'eager':'lazy'}/>}</div>;}):<div className="gallery-image"><div className="gallery-placeholder">No photos uploaded</div></div>}</div>
  <h2>Listing description</h2><p className="detail-copy">{data.description||'No description yet.'}</p>
  <p className="muted">Last confirmed: {data.last_confirmed_at?new Date(data.last_confirmed_at).toLocaleDateString('en-NG'):'Not set'}</p>
  <Link className="button" href={`/admin/listings/${id}/edit`}>Back to edit</Link>
 </article>;
}
