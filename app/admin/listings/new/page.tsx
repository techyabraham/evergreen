import type {Metadata} from 'next';
import Link from 'next/link';
import {ListingFields} from '@/components/admin/listing-fields';
import {requireAdmin} from '@/lib/security/require-admin';

export const metadata:Metadata={title:'Create listing',robots:{index:false,follow:false}};
type Category='property'|'vehicle';
export default async function NewListing({searchParams}:{searchParams:Promise<{category?:string;error?:string}>}){
 const {supabase}=await requireAdmin();
 const {category:rawCategory,error}=await searchParams;
 const category:Category|undefined=rawCategory==='property'||rawCategory==='vehicle'?rawCategory:undefined;
 if(!category)return <section className="wrap admin-page"><header className="page-heading"><p className="eyebrow">Inventory · New</p><h1>What are you adding?</h1><p>Choose a listing type to open the right set of fields.</p></header><div className="admin-choice-grid"><Link className="admin-choice" href="/admin/listings/new?category=property"><span className="admin-choice-icon" aria-hidden="true">⌂</span><span className="eyebrow">Property</span><strong>Add a property</strong><span>Homes for rent, sale, or short let. Includes property details, fees and location.</span><span className="admin-choice-cta">Create property draft <span aria-hidden="true">↗</span></span></Link><Link className="admin-choice" href="/admin/listings/new?category=vehicle"><span className="admin-choice-icon" aria-hidden="true">◈</span><span className="eyebrow">Vehicles</span><strong>Add a vehicle</strong><span>Cars for sale with make, model, year, condition and inspection details.</span><span className="admin-choice-cta">Create vehicle draft <span aria-hidden="true">↗</span></span></Link></div><p className="admin-back"><Link href="/admin/listings">← Back to inventory</Link></p></section>;
 const [{data:types},{data:locations},{data:settings}]=await Promise.all([
  supabase.from('property_types').select('slug,label,group_slug').eq('is_active',true).order('sort_order'),
  supabase.from('locations').select('id,parent_id,level,name,slug').eq('is_active',true).order('sort_order'),
  supabase.from('site_settings').select('short_let_enabled').eq('id',true).maybeSingle(),
 ]);
 return <section className="wrap admin-page"><header className="page-heading"><p className="eyebrow">New {category==='property'?'property':'vehicle'} · Draft</p><h1>Add a {category}.</h1><p>Start with the listing details. Saving creates a private draft and opens the photo manager so you can upload images right away.</p></header><nav className="admin-nav"><Link href="/admin/listings">← Inventory</Link><Link href="/admin">Overview</Link></nav>
  <aside className="photo-step-callout"><span className="photo-step-number" aria-hidden="true">1</span><div><strong>Photos are the next step</strong><p>Save this draft and you’ll go straight to the image uploader. Your listing stays private while you work.</p></div><span className="photo-step-number" aria-hidden="true">2</span></aside>
  {error&&<p className="notice" role="alert">{error==='vehicle-purpose'?'Vehicles can only be listed for sale.':error==='vehicle-fields'?'Add make and model.':error==='property-fields'?'Choose a property type.':error==='price'?'Enter a valid price, or choose price on request.':error==='short-let-disabled'?'Short let is disabled in settings.':error==='category'?'The listing type cannot be changed after creation.':'Check the required fields and try again.'}</p>}
  <ListingFields category={category} types={types||[]} locations={locations||[]} shortLetEnabled={Boolean(settings?.short_let_enabled)}/>
 </section>;
}
