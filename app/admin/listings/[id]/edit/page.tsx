import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ListingFields,type LocationOption,type PropertyTypeOption} from '@/components/admin/listing-fields';
import {ImageUploadForm} from '@/components/admin/image-upload-form';
import {manageListingImage} from '@/app/actions';
import {requireAdmin} from '@/lib/security/require-admin';
import {resolveListingImageUrls} from '@/lib/data';
import type {Listing,ListingImage,PropertyDetails,VehicleDetails} from '@/lib/types';

export const metadata:Metadata={title:'Edit listing',robots:{index:false,follow:false}};
type Params={id:string};type Query={error?:string;saved?:string;photos?:string};
export default async function EditListing({params,searchParams}:{params:Promise<Params>;searchParams:Promise<Query>}){
 const {id}=await params;const {supabase}=await requireAdmin();const {data}=await supabase.from('listings').select('*,property_details(*),vehicle_details(*),listing_fees(*),listing_images(*),listing_private(*)').eq('id',id).maybeSingle();if(!data)notFound();
 const [{data:types},{data:locations},{data:settings}]=await Promise.all([
  supabase.from('property_types').select('slug,label,group_slug').eq('is_active',true).order('sort_order'),
  supabase.from('locations').select('id,parent_id,level,name,slug').eq('is_active',true).order('sort_order'),
  supabase.from('site_settings').select('short_let_enabled').eq('id',true).maybeSingle(),
 ]);
 const listing=data as unknown as Listing&{property_details:PropertyDetails[]|PropertyDetails|null;vehicle_details:VehicleDetails[]|VehicleDetails|null;listing_private:{exact_address:string|null;owner_name:string|null;owner_phone:string|null;vin:string|null;internal_notes:string|null}|null};
 const property=Array.isArray(listing.property_details)?listing.property_details[0]:listing.property_details;const vehicle=Array.isArray(listing.vehicle_details)?listing.vehicle_details[0]:listing.vehicle_details;
 const privateRaw=Array.isArray(listing.listing_private)?listing.listing_private[0]:listing.listing_private;
 const images=([...(listing.listing_images||[])] as ListingImage[]).sort((a,b)=>a.sort_order-b.sort_order);const imageUrls=await resolveListingImageUrls(supabase,images);
 const {error,saved,photos}=await searchParams;
 return <section className="wrap admin-page"><p className="eyebrow">{listing.category==='vehicle'?'Vehicle':'Property'} · {listing.reference_code}</p><h1>Edit {listing.category}.</h1><nav className="admin-quick-links" aria-label="Admin navigation"><Link href="/admin">Overview</Link><Link href="/admin/enquiries">Enquiries</Link></nav><nav className="admin-nav"><Link href={`/admin/listings?category=${listing.category}`}>← Back to {listing.category==='vehicle'?'vehicles':'properties'}</Link><Link href={`/admin/listings/${id}/preview`}>Preview</Link><Link href={`/admin/listings/${id}/share`}>Share kit</Link>{['published','under_offer'].includes(listing.status)&&<Link href={listing.category==='vehicle'?`/car/${listing.vehicle_details?.make||''}-${listing.vehicle_details?.model||''}-${listing.vehicle_details?.year||''}-${listing.city||''}-${listing.reference_code}`:`/property/${listing.slug}-${listing.reference_code}`} target="_blank">View public page ↗</Link>}</nav>
  <a className="photo-step-link" href="#photos-heading"><span aria-hidden="true">＋</span><span><strong>Add or manage listing photos</strong><small>{images.length} of 20 photos · Upload, reorder or choose a cover image</small></span><span className="photo-step-arrow" aria-hidden="true">↓</span></a>
  {saved&&<p className="notice" role="status">Listing saved.</p>}{photos&&<p className="notice" role="status">Photo changes saved.</p>}
  {error&&<p className="notice" role="alert">{error==='publication-migration'?'Supabase is still enforcing the older publishing checklist. Apply migration 202610100001_minimal_listing_publication.sql, then try again.':error==='publication-details'?'Supabase could not find this listing’s property or vehicle details. Save the listing details and try again.':error==='readiness'?'Supabase refused the status change. Confirm that at least one photo is uploaded and selected as the cover; if that is already true, check the applied migrations.':error==='photo-rules'?'Choose a supported photo; the optimized display and thumbnail must each be 2 MB or smaller.':error==='photo-limit'?'A listing can have at most 20 photos.':error==='no-photos'?'Choose a photo.':error==='alt-text'?'Add an accurate photo description.':error==='upload'?'Photo upload failed after retries. Try again.':error==='fees'?'Could not save fee details. You can leave fees blank and add them later.':error==='category'?'Listing type cannot be changed after creation.':'Could not save this change. Check the fields and database connection.'}</p>}
  <section className="photo-workspace" aria-labelledby="photos-heading"><header className="photo-workspace-head"><div><p className="eyebrow">Step 1 · Photos</p><h2 id="photos-heading">Add listing photos</h2><p>Upload clear photos. They’re resized in your browser and embedded GPS metadata is removed. Choose a cover photo, then reorder the rest.</p></div><span className="photo-count">{images.length} of 20</span></header><ImageUploadForm listingId={id} remaining={20-images.length}/>
   {images.length?<div className="photo-admin-grid">{images.map((image,index)=><article className={`photo-admin-card${image.is_cover?' is-cover':''}`} key={image.id}><div className="photo-admin-image">{imageUrls.get(image.id)&&<Image src={imageUrls.get(image.id)!} alt={image.alt_text} width={image.width||1000} height={image.height||700} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" unoptimized loading="lazy"/>}{image.is_cover&&<span className="photo-cover-badge">Cover photo</span>}</div><div className="photo-admin-body"><p>{image.alt_text}</p><form action={manageListingImage} className="photo-actions"><input type="hidden" name="id" value={id}/><input type="hidden" name="image_id" value={image.id}/><button name="operation" value="move-up" aria-label={`Move photo ${index+1} earlier`} disabled={index===0}>Move up</button><button name="operation" value="move-down" aria-label={`Move photo ${index+1} later`} disabled={index===images.length-1}>Move down</button>{!image.is_cover&&<button name="operation" value="cover">Make cover</button>}<button className="photo-remove" name="operation" value="delete">Remove</button></form></div></article>)}</div>:<div className="photo-empty"><span aria-hidden="true">▧</span><strong>No photos yet</strong><p>Add one cover photo. You can add more later.</p></div>}
  </section>
  <div className="listing-details-heading"><p className="eyebrow">Step 2 · Listing details</p><h2>Property and listing information</h2><p>Update the details below and save when you’re done.</p></div>
  <ListingFields listing={listing} property={property} vehicle={vehicle} privateData={privateRaw} locations={(locations||[]) as LocationOption[]} types={(types||[]) as PropertyTypeOption[]} shortLetEnabled={Boolean(settings?.short_let_enabled)} category={listing.category}/>
 </section>;
}
