import type {Metadata} from 'next';
import Link from 'next/link';
import {ListingFields} from '@/components/admin/listing-fields';
import {requireAdmin} from '@/lib/security/require-admin';
export const metadata:Metadata={title:'Create listing',robots:{index:false,follow:false}};
export default async function NewListing({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {supabase}=await requireAdmin();const [{data:types},{data:locations},{data:settings}]=await Promise.all([
  supabase.from('property_types').select('slug,label,group_slug').eq('is_active',true).order('sort_order'),
  supabase.from('locations').select('id,parent_id,level,name,slug').eq('is_active',true).order('sort_order'),
  supabase.from('site_settings').select('short_let_enabled').eq('id',true).maybeSingle(),
 ]);const {error}=await searchParams;
 return <section className="wrap text-page"><p className="eyebrow">Inventory · New</p><h1>Create a listing</h1><nav className="admin-nav"><Link href="/admin/listings">← All listings</Link><Link href="/admin">Overview</Link></nav>
  {error&&<p className="notice" role="alert">{error==='vehicle-purpose'?'Vehicles can only be listed for sale.':error==='vehicle-fields'?'Add make and model.':error==='property-fields'?'Choose a property type.':error==='price'?'Enter a valid price, or choose price on request.':error==='short-let-disabled'?'Short let is disabled in settings.':'Check the required fields and try again.'}</p>}
  <p>Save a draft while you gather details. Publishing is blocked until required details, photos, confirmation and fees are ready.</p>
  <ListingFields types={types||[]} locations={locations||[]} shortLetEnabled={Boolean(settings?.short_let_enabled)}/>
 </section>;
}
