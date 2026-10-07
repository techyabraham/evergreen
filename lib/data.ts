import { createClient } from '@/lib/supabase/server';
import type { Listing } from '@/lib/types';
import { parseListingFilters } from '@/lib/validation';

const selectBase='id,slug,reference_code,category,purpose,title,description,price_amount,currency,price_period,negotiable,state,city,area,public_location,status,featured,last_confirmed_at,published_at,updated_at,property_details(*),vehicle_details(*),listing_images(id,storage_path,alt_text,sort_order,is_cover)';
const shortLetEnabled=process.env.NEXT_PUBLIC_ENABLE_SHORT_LET!=='false';

export async function getListings(filters: Record<string,string|undefined>={},limit=24,offset=0,excludeId?:string):Promise<Listing[]>{
  filters=parseListingFilters(filters);
  const supabase=await createClient();if(!supabase)return [];
  const select=selectBase.replace('property_details(*)',`property_details${filters.category==='property'?'!inner':''}(*)`).replace('vehicle_details(*)',`vehicle_details${filters.category==='vehicle'?'!inner':''}(*)`);
  let query=supabase.from('listings').select(select).eq('status','published').range(offset,offset+limit-1);
  if(excludeId)query=query.neq('id',excludeId);
  if(!shortLetEnabled)query=query.neq('purpose','short_let');
  if(filters.category)query=query.eq('category',filters.category);
  if(filters.purpose)query=query.eq('purpose',filters.purpose);
  if(filters.q){const term=filters.q.replace(/[^a-zA-Z0-9 -]/g,'').trim();if(term)query=query.or(`title.ilike.%${term}%,area.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`);}
  if(filters.state)query=query.ilike('state',filters.state);
  if(filters.city)query=query.ilike('city',`%${filters.city.replace(/[%_,]/g,'')}%`);
  if(filters.min&&/^\d{1,16}$/.test(filters.min))query=query.gte('price_amount',Number(filters.min));
  if(filters.max&&/^\d{1,16}$/.test(filters.max))query=query.lte('price_amount',Number(filters.max));
  if(filters.property_type)query=query.ilike('property_details.property_type',filters.property_type);
  if(filters.bedrooms&&/^\d{1,2}$/.test(filters.bedrooms))query=query.gte('property_details.bedrooms',Number(filters.bedrooms));
  if(filters.bathrooms&&/^\d{1,2}$/.test(filters.bathrooms))query=query.gte('property_details.bathrooms',Number(filters.bathrooms));
  if(filters.furnishing)query=query.eq('property_details.furnishing',filters.furnishing);
  if(filters.amenity)query=query.contains('property_details.amenities',[filters.amenity]);
  if(filters.make)query=query.ilike('vehicle_details.make',`%${filters.make.replace(/[%_,]/g,'')}%`);
  if(filters.model)query=query.ilike('vehicle_details.model',`%${filters.model.replace(/[%_,]/g,'')}%`);
  if(filters.year_min&&/^\d{4}$/.test(filters.year_min))query=query.gte('vehicle_details.year',Number(filters.year_min));
  if(filters.year_max&&/^\d{4}$/.test(filters.year_max))query=query.lte('vehicle_details.year',Number(filters.year_max));
  if(filters.condition)query=query.eq('vehicle_details.condition',filters.condition);
  if(filters.transmission)query=query.eq('vehicle_details.transmission',filters.transmission);
  if(filters.fuel_type)query=query.eq('vehicle_details.fuel_type',filters.fuel_type);
  if(filters.import_status)query=query.eq('vehicle_details.import_status',filters.import_status);
  if(filters.sort==='price_asc')query=query.order('price_amount',{ascending:true}).order('published_at',{ascending:false}).order('id',{ascending:true});
  else if(filters.sort==='price_desc')query=query.order('price_amount',{ascending:false}).order('published_at',{ascending:false}).order('id',{ascending:true});
  else query=query.order('published_at',{ascending:false}).order('id',{ascending:true});
  const {data}=await query;const listings=(data??[]) as unknown as Listing[];
  return Promise.all(listings.map(async item=>({...item,listing_images:await signedImages(supabase,item.listing_images??[])})));
}
async function signedImages(client:NonNullable<Awaited<ReturnType<typeof createClient>>>,images:Listing['listing_images']){if(!images?.length)return images??[];const {data}=await client.storage.from('listing-media').createSignedUrls(images.map(image=>image.storage_path),3600);return images.map((image,index)=>({...image,url:data?.[index]?.signedUrl??undefined}));}
export async function getListing(slug:string,category?:Listing['category']):Promise<Listing|null>{const supabase=await createClient();if(!supabase)return null;let query=supabase.from('listings').select(selectBase).eq('slug',slug).eq('status','published');if(category)query=query.eq('category',category);if(!shortLetEnabled)query=query.neq('purpose','short_let');const {data}=await query.maybeSingle();if(!data)return null;const item=data as unknown as Listing;return {...item,listing_images:await signedImages(supabase,item.listing_images??[])};}
