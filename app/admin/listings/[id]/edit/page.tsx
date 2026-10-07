import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ListingFields,type LocationOption,type PropertyTypeOption} from '@/components/admin/listing-fields';
import {ImageUploadForm} from '@/components/admin/image-upload-form';
import {manageListingImage} from '@/app/actions';
import {requireAdmin} from '@/lib/security/require-admin';
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
 const images=([...(listing.listing_images||[])] as ListingImage[]).sort((a,b)=>a.sort_order-b.sort_order);const {data:signed}=images.length?await supabase.storage.from('listing-media').createSignedUrls(images.map(image=>image.storage_path),3600):{data:[]};
 const {error,saved,photos}=await searchParams;
 return <section className="wrap text-page"><p className="eyebrow">Inventory · {listing.reference_code}</p><h1>Edit listing</h1><nav className="admin-nav"><Link href="/admin/listings">← All listings</Link><Link href={`/admin/listings/${id}/preview`}>Preview</Link><Link href={`/admin/listings/${id}/share`}>Share kit</Link>{['published','under_offer'].includes(listing.status)&&<Link href={listing.category==='vehicle'?`/car/${listing.vehicle_details?.make||''}-${listing.vehicle_details?.model||''}-${listing.vehicle_details?.year||''}-${listing.city||''}-${listing.reference_code}`:`/property/${listing.slug}-${listing.reference_code}`} target="_blank">View public page ↗</Link>}</nav>
  {saved&&<p className="notice" role="status">Listing saved.</p>}{photos&&<p className="notice" role="status">Photo changes saved.</p>}
  {error&&<p className="notice" role="alert">{error==='readiness'?'Publishing is blocked. Complete the readiness items, add at least three photos, confirm availability, and resolve or acknowledge required fees.':error==='photo-rules'?'Choose a supported photo; the optimized display and thumbnail must each be 2 MB or smaller.':error==='photo-limit'?'A listing can have at most 20 photos.':error==='no-photos'?'Choose a photo.':error==='alt-text'?'Add an accurate photo description.':error==='upload'?'Photo upload failed after retries. Try again.':error==='fees'?'Could not save structured fees.':'Could not save this change. Check the fields and database connection.'}</p>}
  <ListingFields listing={listing} property={property} vehicle={vehicle} privateData={privateRaw} locations={(locations||[]) as LocationOption[]} types={(types||[]) as PropertyTypeOption[]} shortLetEnabled={Boolean(settings?.short_let_enabled)}/>
  <section aria-labelledby="photos-heading"><h2 id="photos-heading">Listing photos</h2><p className="muted">Photos are resized in the browser, which removes embedded EXIF and GPS metadata. Reordering buttons work with a keyboard.</p><ImageUploadForm listingId={id}/>
   <div className="cards photo-admin-grid" style={{marginTop:20}}>{images.map((image,index)=><article className="card" key={image.id}><div className="card-image">{signed?.[index]?.signedUrl&&<Image src={signed[index].signedUrl} alt={image.alt_text} width={image.width||1000} height={image.height||700} sizes="(max-width: 600px) 100vw, 45vw" unoptimized loading="lazy"/>}</div><div className="card-body"><p>{image.is_cover?'Cover photo':'Photo'} · {image.alt_text}</p><form action={manageListingImage} className="photo-actions"><input type="hidden" name="id" value={id}/><input type="hidden" name="image_id" value={image.id}/><button name="operation" value="move-up" aria-label={`Move photo ${index+1} earlier`}>Move up</button><button name="operation" value="move-down" aria-label={`Move photo ${index+1} later`}>Move down</button>{!image.is_cover&&<button name="operation" value="cover">Make cover</button>}<button name="operation" value="delete">Remove</button></form></div></article>)}</div>
  </section>
 </section>;
}
