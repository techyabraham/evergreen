import {createPublicClient} from '@/lib/supabase/public';
import type {Listing} from '@/lib/types';
import {parseListingFilters} from '@/lib/validation';

const DEMO_REFERENCES=new Set(['DM3A4B','DM3C5D','DM3E6F']);
export const isDemoReference=(reference:string)=>DEMO_REFERENCES.has(reference);
const selectBase='id,slug,reference_code,category,purpose,title,description,price_amount,currency,price_period,price_on_request,negotiable,state,city,area,location_id,public_location,public_location_label,status,featured,featured_rank,last_confirmed_at,realtor_inspected_at,published_at,updated_at,status_changed_at,rented_at,sold_at,is_newly_built,is_serviced,video_url,virtual_tour_url,property_details(*),vehicle_details(*),listing_fees(*),listing_images(id,storage_path,thumb_path,blur_data_url,width,height,alt_text,sort_order,is_cover)';

export async function getListings(filters:Record<string,string|undefined>={},limit=12,offset=0,excludeId?:string):Promise<Listing[]>{
 filters=parseListingFilters(filters);const supabase=createPublicClient();if(!supabase)return [];
 const select=selectBase.replace('property_details(*)',`property_details${filters.category==='property'?'!inner':''}(*)`).replace('vehicle_details(*)',`vehicle_details${filters.category==='vehicle'?'!inner':''}(*)`);
 let query=supabase.from('listings').select(select).in('status',['published','under_offer']).range(offset,offset+Math.min(limit,48)-1);
 if(excludeId)query=query.neq('id',excludeId);
 if(filters.category)query=query.eq('category',filters.category);
 if(filters.featured==='true')query=query.eq('featured',true);
 if(filters.purpose)query=query.eq('purpose',filters.purpose);
 if(filters.q){const term=filters.q.replace(/[^\p{L}\p{N} -]/gu,' ').trim().slice(0,80);if(term)query=query.textSearch('search_tsv',term,{config:'simple',type:'websearch'});}
 if(filters.state)query=query.ilike('state',filters.state.replace(/[%_,]/g,''));
 if(filters.city)query=query.ilike('city',`%${filters.city.replace(/[%_,]/g,'')}%`);
 if(filters.area)query=query.ilike('area',`%${filters.area.replace(/[%_,]/g,'')}%`);
 if(filters.min&&/^\d{1,16}$/.test(filters.min))query=query.gte('sort_price',Number(filters.min));
 if(filters.max&&/^\d{1,16}$/.test(filters.max))query=query.lte('sort_price',Number(filters.max));
 if(filters.property_type){const types=filters.property_type.split(',').filter(Boolean);query=types.length>1?query.in('property_details.property_type',types):query.eq('property_details.property_type',types[0]);}
 if(filters.bedrooms&&/^\d{1,2}$/.test(filters.bedrooms)){const beds=Number(filters.bedrooms);query=beds>=5?query.gte('property_details.bedrooms',5):query.eq('property_details.bedrooms',beds);}
 if(filters.bathrooms&&/^\d{1,2}$/.test(filters.bathrooms))query=query.gte('property_details.bathrooms',Number(filters.bathrooms));
 if(filters.furnishing)query=query.eq('property_details.furnishing',filters.furnishing);
 if(filters.amenity)query=query.contains('property_details.amenities',[filters.amenity]);
 if(filters.serviced==='true')query=query.eq('is_serviced',true);
 if(filters.new==='true')query=query.eq('is_newly_built',true);
 if(filters.make)query=query.ilike('vehicle_details.make',`%${filters.make.replace(/[%_,]/g,'')}%`);
 if(filters.model)query=query.ilike('vehicle_details.model',`%${filters.model.replace(/[%_,]/g,'')}%`);
 if(filters.vehicle_class)query=query.eq('vehicle_details.vehicle_class',filters.vehicle_class);
 if(filters.year_min&&/^\d{4}$/.test(filters.year_min))query=query.gte('vehicle_details.year',Number(filters.year_min));
 if(filters.year_max&&/^\d{4}$/.test(filters.year_max))query=query.lte('vehicle_details.year',Number(filters.year_max));
 if(filters.condition)query=query.eq('vehicle_details.condition',filters.condition);
 if(filters.transmission)query=query.eq('vehicle_details.transmission',filters.transmission);
 if(filters.fuel_type)query=query.eq('vehicle_details.fuel_type',filters.fuel_type);
 if(filters.import_status)query=query.eq('vehicle_details.import_status',filters.import_status);
 const settings=await supabase.from('site_settings').select('auto_hide_stale,stale_after_days,short_let_enabled,cars_enabled').eq('id',true).maybeSingle();
 if(!settings.data?.short_let_enabled&&process.env.NEXT_PUBLIC_ENABLE_SHORT_LET!=='true')query=query.neq('purpose','short_let');
 if(settings.data?.cars_enabled===false&&(filters.category==='vehicle'||!filters.category))query=query.neq('category','vehicle');
 if(settings.data?.auto_hide_stale){const threshold=new Date(Date.now()-settings.data.stale_after_days*86_400_000).toISOString();query=query.or(`last_confirmed_at.gte.${threshold},reference_code.in.(${[...DEMO_REFERENCES].join(',')})`);}
 if(filters.sort==='price_asc')query=query.order('sort_price',{ascending:true,nullsFirst:false}).order('published_at',{ascending:false}).order('id',{ascending:true});
 else if(filters.sort==='price_desc')query=query.order('sort_price',{ascending:false,nullsFirst:false}).order('published_at',{ascending:false}).order('id',{ascending:true});
 else if(filters.sort==='beds_desc')query=query.order('property_details(bedrooms)',{ascending:false}).order('published_at',{ascending:false}).order('id',{ascending:true});
 else query=query.order('published_at',{ascending:false}).order('id',{ascending:true});
 const {data}=await query;const listings=((data??[]) as unknown as Listing[]).map(item=>({...item,is_demo:isDemoReference(item.reference_code)}));
 return Promise.all(listings.map(async item=>({...item,listing_images:await signedImages(supabase,item.listing_images??[])})));
}

export function demoImageUrl(path:string){
 const images:Record<string,string>={
  'demo-assets/bodija-exterior':'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=82',
  'demo-assets/lekki-exterior':'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=82',
  'demo-assets/maitama-interior':'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82',
 };
 return images[path]??null;
}

export async function resolveListingImageUrls(client:NonNullable<ReturnType<typeof createPublicClient>>,images:NonNullable<Listing['listing_images']>){
 if(!images.length)return new Map<string,string>();
 const storageImages=images.filter(image=>!demoImageUrl(image.storage_path));
 const paths=storageImages.map(image=>image.thumb_path||image.storage_path);
 const {data}=paths.length?await client.storage.from('listing-media').createSignedUrls(paths,3600):{data:[]};
 const urls=new Map<string,string>();
 for(const image of images){
  const demoUrl=demoImageUrl(image.storage_path);if(demoUrl){urls.set(image.id,demoUrl);continue;}
  const storageIndex=storageImages.findIndex(row=>row.id===image.id);const signedUrl=storageIndex>=0?data?.[storageIndex]?.signedUrl:undefined;if(signedUrl)urls.set(image.id,signedUrl);
 }
 return urls;
}

async function signedImages(client:NonNullable<ReturnType<typeof createPublicClient>>,images:NonNullable<Listing['listing_images']>){
 const urls=await resolveListingImageUrls(client,images);
 return images.map(image=>({...image,url:urls.get(image.id)}));
}

export async function getListing(slug:string,category?:Listing['category']):Promise<Listing|null>{
 const supabase=createPublicClient();if(!supabase)return null;const {data:settings}=await supabase.from('site_settings').select('short_let_enabled,cars_enabled,closed_listings_public_days').eq('id',true).maybeSingle();const cutoff=new Date(Date.now()-(settings?.closed_listings_public_days??90)*86_400_000).toISOString();let query=supabase.from('listings').select(selectBase).eq('slug',slug).or(`status.in.(published,under_offer),and(status.in.(rented,sold),status_changed_at.gte.${cutoff})`);
 if(category)query=query.eq('category',category);if(!settings?.short_let_enabled&&process.env.NEXT_PUBLIC_ENABLE_SHORT_LET!=='true')query=query.neq('purpose','short_let');if(category==='vehicle'&&settings?.cars_enabled===false)return null;
 const {data}=await query.maybeSingle();if(!data||isDemoReference(data.reference_code))return null;const item=data as unknown as Listing;
 return {...item,listing_images:await signedImages(supabase,item.listing_images??[])};
}

export async function getListingByReference(reference:string,category?:Listing['category']):Promise<Listing|null>{
 const supabase=createPublicClient();if(!supabase)return null;const {data:settings}=await supabase.from('site_settings').select('short_let_enabled,cars_enabled,closed_listings_public_days').eq('id',true).maybeSingle();const cutoff=new Date(Date.now()-(settings?.closed_listings_public_days??90)*86_400_000).toISOString();let query=supabase.from('listings').select(selectBase).eq('reference_code',reference.toUpperCase()).or(`status.in.(published,under_offer),and(status.in.(rented,sold),status_changed_at.gte.${cutoff})`);
 if(category)query=query.eq('category',category);if(!settings?.short_let_enabled&&process.env.NEXT_PUBLIC_ENABLE_SHORT_LET!=='true')query=query.neq('purpose','short_let');if(category==='vehicle'&&settings?.cars_enabled===false)return null;const {data}=await query.maybeSingle();if(!data)return null;const item={...(data as unknown as Listing),is_demo:isDemoReference(data.reference_code)};
 return {...item,listing_images:await signedImages(supabase,item.listing_images??[])};
}

export async function getPublicSettings(){
 const client=createPublicClient();if(!client)return null;
 const {data}=await client.from('site_settings').select('brand_name,tagline,logo_path,realtor_name,realtor_bio,realtor_photo_path,credentials_text,whatsapp_number,phone,email,office_address_public,short_let_enabled,cars_enabled,show_exact_address,stale_after_days,auto_hide_stale,closed_listings_public_days,enquiry_retention_days,privacy_contact_email,safety_tips,social,updated_at').eq('id',true).maybeSingle();
 return data;
}

export async function getPropertyRouteOptions(){const client=createPublicClient();if(!client)return {types:[],locations:[]};const [types,locations]=await Promise.all([client.from('property_types').select('slug,group_slug,is_active').eq('is_active',true).order('sort_order'),client.from('locations').select('id,parent_id,level,slug,name,is_active').eq('is_active',true).order('sort_order')]);return {types:types.data??[],locations:locations.data??[]};}

export async function getRecentlyClosed(){
 const client=createPublicClient();if(!client)return [];
 const {data:settings}=await client.from('site_settings').select('closed_listings_public_days').eq('id',true).maybeSingle();
 const cutoff=new Date(Date.now()-(settings?.closed_listings_public_days??90)*86_400_000).toISOString();
 const {data}=await client.from('listings').select(selectBase).in('status',['rented','sold']).gte('status_changed_at',cutoff).order('status_changed_at',{ascending:false}).limit(12);
 return ((data??[]) as unknown as Listing[]).map(item=>({...item,is_demo:isDemoReference(item.reference_code)}));
}
