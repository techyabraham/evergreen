'use server';
import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {revalidatePath} from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { enquirySchema,listingInputSchema } from '@/lib/validation';
import {submitPublicEnquiry,submitPublicReport} from '@/lib/data/public-submissions';
import {hashIp} from '@/lib/security/ip-hash';
import {normalizePhone} from '@/lib/domain/phone';
import {requireAdmin} from '@/lib/security/require-admin';
import {slugPart} from '@/lib/domain/slug';

export async function signIn(form:FormData){const supabase=await createClient();if(!supabase)redirect('/admin/login?error=configuration');const email=String(form.get('email')||'');const password=String(form.get('password')||'');const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error||!data.user)redirect('/admin/login?error=credentials');const {data:profile}=await supabase.from('profiles').select('role').eq('id',data.user.id).maybeSingle();if(profile?.role!=='admin'){await supabase.auth.signOut();redirect('/admin/login?error=unauthorized');}redirect('/admin');}
export async function signOut(){const {supabase}=await requireAdmin();await supabase.auth.signOut();redirect('/admin/login');}

export async function submitEnquiry(form:FormData){
  if(form.get('website'))redirect('/contact?sent=1');
  const requestHeaders=await headers();const origin=requestHeaders.get('origin');const host=requestHeaders.get('x-forwarded-host')||requestHeaders.get('host');
  try{if(!origin||!host||new URL(origin).host!==host)redirect('/contact?error=origin');}catch{redirect('/contact?error=origin');}
  const parsed=enquirySchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect('/contact?error=details');
  const fields=parsed.data;const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const phone=fields.phone?normalizePhone(fields.phone):null;if(fields.phone&&!phone)redirect('/contact?error=details');
  const result=await submitPublicEnquiry({listing_reference:fields.listing_reference||'',request_type:'availability',name:fields.name,phone:fields.phone||'',phone_normalized:phone,email:fields.email||'',message:fields.message,preferred_contact:fields.preferred_contact==='phone'?'call':fields.preferred_contact,consent:'true',criteria:null,source_path:requestHeaders.get('referer')||'',utm:null,ip_hash:hashIp(ip)});
  if(result.ok)redirect('/contact?sent=1');
  redirect(result.code==='RATE_LIMITED'?'/contact?error=rate':'/contact?error=unavailable');
}

const reportSchema=z.object({listing_reference:z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/),listing_slug:z.string().regex(/^[a-z0-9-]{1,100}$/).optional(),reason:z.enum(['no_longer_available','incorrect_info','suspected_fraud','marketed_without_consent','offensive_content','other']),details:z.string().trim().max(500).optional(),contact:z.string().trim().max(254).optional()});
export async function submitListingReport(form:FormData){
  if(form.get('website'))redirect('/contact?sent=1');const parsed=reportSchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect('/contact?error=details');
  const requestHeaders=await headers();const origin=requestHeaders.get('origin');const host=requestHeaders.get('x-forwarded-host')||requestHeaders.get('host');
  try{if(!origin||!host||new URL(origin).host!==host)redirect('/contact?error=origin');}catch{redirect('/contact?error=origin');}
  const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const result=await submitPublicReport({...parsed.data,ip_hash:hashIp(ip)});
  if(result.ok)redirect(`/property/${parsed.data.listing_slug||parsed.data.listing_reference}?reported=1`);redirect('/contact?error=unavailable');
}
const propertyRequestSchema=z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().max(32).optional(),email:z.union([z.string().email().max(254),z.literal('')]).optional(),preferred_contact:z.enum(['phone','email','whatsapp']),purpose:z.enum(['rent','sale','short_let']),property_type:z.string().trim().max(80).optional(),bedrooms:z.string().regex(/^$|^\d{1,2}$/).optional(),max_budget:z.string().regex(/^$|^\d{1,16}$/).optional(),state:z.string().trim().max(80).optional(),city:z.string().trim().max(80).optional(),area:z.string().trim().max(100).optional(),message:z.string().trim().max(1000).optional(),consent:z.literal('yes')}).refine(value=>Boolean(value.phone||value.email),{message:'Provide a phone number or email address.'});
export async function submitPropertyRequest(form:FormData){
 if(form.get('website'))redirect('/request?sent=1');const requestHeaders=await headers();const origin=requestHeaders.get('origin');const host=requestHeaders.get('x-forwarded-host')||requestHeaders.get('host');
 try{if(!origin||!host||new URL(origin).host!==host)redirect('/request?error=origin');}catch{redirect('/request?error=origin');}
 const parsed=propertyRequestSchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect('/request?error=details');const fields=parsed.data;const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const phone=fields.phone?normalizePhone(fields.phone):null;if(fields.phone&&!phone)redirect('/request?error=details');
 const criteria={purpose:fields.purpose,type:fields.property_type||null,beds:fields.bedrooms?Number(fields.bedrooms):null,maxBudget:fields.max_budget?Number(fields.max_budget):null,state:fields.state||null,city:fields.city||null,area:fields.area||null};
 const result=await submitPublicEnquiry({request_type:'property_request',listing_reference:'',name:fields.name,phone:fields.phone||'',phone_normalized:phone,email:fields.email||'',message:fields.message?.trim()||'Property search request',preferred_contact:fields.preferred_contact==='phone'?'call':fields.preferred_contact,consent:'true',criteria,source_path:'/request',utm:null,ip_hash:hashIp(ip)});
 if(result.ok)redirect('/request?sent=1');redirect(result.code==='RATE_LIMITED'?'/request?error=rate':'/request?error=unavailable');
}export async function confirmListingAvailable(form:FormData){const {supabase}=await requireAdmin();const id=String(form.get('id')||'');const {data:listing}=await supabase.from('listings').select('reference_code').eq('id',id).maybeSingle();if(!listing)redirect('/admin/listings?error=missing');const now=new Date().toISOString();const {error}=await supabase.from('listings').update({last_confirmed_at:now,updated_at:now}).eq('id',id);if(error)redirect('/admin/listings?error=save');redirect('/admin/listings?saved=confirmed');}export async function saveListing(form:FormData){
 const {supabase,user}=await requireAdmin();
 const id=String(form.get('id')||'');const categoryFromForm=form.get('category')==='vehicle'?'vehicle':'property';const editorError=(error:string)=>id?`/admin/listings/${id}/edit?error=${error}`:`/admin/listings/new?category=${categoryFromForm}&error=${error}`;
 const parsed=listingInputSchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect(editorError('validation'));
 const x=parsed.data;const {data:settings}=await supabase.from('site_settings').select('short_let_enabled').eq('id',true).maybeSingle();
 if(x.purpose==='short_let'&&!settings?.short_let_enabled)redirect(editorError('short-let-disabled'));
 if(x.category==='vehicle'&&x.purpose!=='sale')redirect(editorError('vehicle-purpose'));
 const onRequest=x.price_period==='price_on_request'||!x.price_amount;const price=onRequest?null:Number(x.price_amount);
 if(!onRequest&&(price===null||!Number.isFinite(price)||price<=0))redirect(editorError('price'));
 const {data:previous}=id?await supabase.from('listings').select('id,category,status,published_at,reference_code,slug').eq('id',id).maybeSingle():{data:null};
 if(id&&!previous)redirect('/admin/listings?error=missing');
 if(previous&&previous.category!==x.category)redirect(`/admin/listings/${id}/edit?error=category`);
 const rawSlug=String(form.get('slug')||x.title);let slug=slugPart(rawSlug).slice(0,100).replace(/-+$/,'')||'listing';
 if(!id){const {data:duplicate}=await supabase.from('listings').select('id').eq('slug',slug).maybeSingle();if(duplicate)slug=`${slug.slice(0,88)}-${randomUUID().slice(0,6).toLowerCase()}`;}
 const locationId=x.location_id||null;let state=x.state||null;let city=x.city||null;let area=x.area||null;
 if(locationId){const {data:allLocations}=await supabase.from('locations').select('id,parent_id,level,name').eq('is_active',true);const byId=new Map((allLocations||[]).map(row=>[row.id,row]));let cursor=byId.get(locationId);const chain=[];while(cursor){chain.unshift(cursor);cursor=cursor.parent_id?byId.get(cursor.parent_id):undefined;}state=chain.find(row=>row.level==='state')?.name||state;city=chain.find(row=>row.level==='city')?.name||city;area=[...chain].reverse().find(row=>row.level==='area'||row.level==='estate')?.name||area;}
 const values={category:x.category,purpose:x.purpose,title:x.title,description:x.description,price_amount:price,price_on_request:onRequest,price_period:onRequest?null:x.price_period,currency:'NGN',slug,state,city,area,public_location_label:x.public_location_label||[area,city,state].filter(Boolean).join(', ')||null,location_id:locationId,status:previous?.status||'draft',featured:false,last_confirmed_at:x.last_confirmed_at?new Date(x.last_confirmed_at).toISOString():null,fees_ack_at:x.fees_acknowledged?new Date().toISOString():null,updated_at:new Date().toISOString(),...(previous?{}:{created_by:user.id})};
 let listingId=id;
 if(previous){const {error}=await supabase.from('listings').update(values).eq('id',listingId);if(error)redirect(`/admin/listings/${id}/edit?error=save`);}
 else{const {data,error}=await supabase.from('listings').insert({...values,created_by:user.id}).select('id').single();if(error||!data)redirect(editorError('save'));listingId=data.id;}
 if(x.category==='property'){
  await supabase.from('vehicle_details').delete().eq('listing_id',listingId);
  const amenities=(x.amenities||'').split(',').map(value=>value.trim().toLowerCase().replaceAll(' ','_')).filter(value=>['gated_estate','security_24h','cctv','security_doors','perimeter_fence','prepaid_meter','standby_generator','solar_inverter','borehole_water','water_treatment','fast_internet','street_lights','drainage_system','all_rooms_ensuite','pop_ceiling','fitted_kitchen','fitted_wardrobes','fitted_ac','tiled_floors','balcony','big_compound','swimming_pool','gym','elevator','garden','parking_space','supermarket_nearby','good_road_access','near_public_transport','school_nearby'].includes(value));
  const furnishing=x.furnishing?.toLowerCase().replaceAll('-','_').replaceAll(' ','_')||null;
  const details={listing_id:listingId,property_type:x.property_type||null,bedrooms:x.bedrooms?Number(x.bedrooms):null,bathrooms:x.bathrooms?Number(x.bathrooms):null,agent_fee:money(x.agent_fee),agreement_fee:money(x.agreement_fee),legal_fee:money(x.legal_fee),caution_fee:money(x.caution_fee),service_charge:money(x.service_charge),rent_payment_frequency:x.rent_payment_frequency||null,furnishing,amenities,advance_rent_months:x.advance_rent_months?Number(x.advance_rent_months):null,title_type:x.title_type||null};
  const {error}=await supabase.from('property_details').upsert(details);if(error)redirect(`/admin/listings/${listingId}/edit?error=details`);
  await supabase.from('listing_fees').delete().eq('listing_id',listingId);
  if(x.purpose==='rent'||x.purpose==='short_let'){
   const feeDefs=[['agency','Agency fee',x.fee_agency_state,x.agent_fee],['agreement_legal','Agreement/legal fee',x.fee_agreement_legal_state,combineMoney(x.agreement_fee,x.legal_fee)],['caution_deposit','Caution deposit',x.fee_caution_state,x.caution_fee],['service_charge','Service charge',x.fee_service_state,x.service_charge]] as const;
   const rows=feeDefs.map(([fee_type,label,state,raw])=>{const feeState=state||(raw?'known':'unknown');const amount=feeState==='known'?money(raw):null;return {listing_id:listingId,fee_type,label,state:feeState,amount,percent_of_rent:null,frequency:fee_type==='service_charge'?(x.fee_service_frequency||'year'):'one_time',refundable:fee_type==='caution_deposit'?true:null,note:null};});
   if(rows.some(row=>row.state==='known'&&row.amount===null))redirect(`/admin/listings/${listingId}/edit?error=fee`);
   const {error:feeError}=await supabase.from('listing_fees').insert(rows);if(feeError)redirect(`/admin/listings/${listingId}/edit?error=fees`);
  }
 }else{
  await supabase.from('property_details').delete().eq('listing_id',listingId);await supabase.from('listing_fees').delete().eq('listing_id',listingId);
  const condition=x.condition?.toLowerCase().includes('new')?'new':x.condition?'used':null;
  const importStatus=x.import_status?.toLowerCase().includes('foreign')?'foreign_used':x.import_status?.toLowerCase().includes('nigerian')?'nigerian_used':x.import_status?'brand_new':null;
  const details={listing_id:listingId,make:x.make||null,model:x.model||null,year:x.year?Number(x.year):null,mileage:x.mileage?Number(x.mileage):null,mileage_unit:x.mileage?'km':null,condition,import_status:importStatus,transmission:x.transmission?.toLowerCase()||null,fuel_type:x.fuel_type?.toLowerCase()||null,colour:x.colour||null,vehicle_class:x.vehicle_class||null};
 const {error}=await supabase.from('vehicle_details').upsert(details);if(error)redirect(`/admin/listings/${listingId}/edit?error=details`);
 }
 const privateFields={listing_id:listingId,exact_address:x.exact_address||null,owner_name:x.owner_name||null,owner_phone:x.owner_phone||null,vin:x.vin||null,internal_notes:x.internal_notes||null,updated_at:new Date().toISOString()};
 const {error:privateError}=await supabase.from('listing_private').upsert(privateFields);if(privateError)redirect(`/admin/listings/${listingId}/edit?error=private`);
 const desiredStatus=x.status;const currentStatus=previous?.status||'draft';
 if(desiredStatus!==currentStatus){if(desiredStatus==='under_offer'&&currentStatus==='draft'){const first=await supabase.rpc('admin_transition_listing',{p_listing_id:listingId,p_status:'published',p_note:x.relist_note||null});if(first.error||!(first.data as {ok?:boolean}|null)?.ok)redirect(`/admin/listings/${listingId}/edit?error=readiness`);}
  const {data:transition,error}=await supabase.rpc('admin_transition_listing',{p_listing_id:listingId,p_status:desiredStatus,p_note:x.relist_note||null});if(error||!(transition as {ok?:boolean}|null)?.ok)redirect(`/admin/listings/${listingId}/edit?error=readiness`);
 }
 redirect(`/admin/listings/${listingId}/edit?saved=1${id?'':'#photos-heading'}`);
}
function money(value:string|undefined){if(!value)return null;const amount=Number(value);return Number.isFinite(amount)&&amount>=0?amount:null;}
function combineMoney(first:string|undefined,second:string|undefined){const a=money(first),b=money(second);if(a===null&&b===null)return undefined;return String((a??0)+(b??0));}export async function setListingStatus(form:FormData){const {supabase}=await requireAdmin();const id=String(form.get('id')||'');const status=String(form.get('status')||'');const note=String(form.get('note')||'').trim();if(!z.enum(['draft','published','under_offer','rented','sold','archived']).safeParse(status).success)redirect('/admin/listings?error=status');const {data,error}=await supabase.rpc('admin_transition_listing',{p_listing_id:id,p_status:status,p_note:note||null});if(error||!(data as {ok?:boolean}|null)?.ok)redirect('/admin/listings?error=transition');redirect('/admin/listings?saved=1');}
export async function uploadListingImages(form:FormData){
 const {supabase}=await requireAdmin();const id=String(form.get('id')||'');
 const display=form.get('display');const thumb=form.get('thumb');const altText=String(form.get('alt_text')||'').trim()||'Listing photo';const width=Number(form.get('width'));const height=Number(form.get('height'));const blurData=String(form.get('blur_data_url')||'');
 if(!z.string().uuid().safeParse(id).success)return {ok:false,error:'photo-rules'};
 if(!(display instanceof File)||!(thumb instanceof File)||display.size===0||thumb.size===0||altText.length>200||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>10000||height>10000||!blurData.startsWith('data:image/')||blurData.length>2048)return {ok:false,error:'photo-rules'};
 if(display.size>2*1024*1024||thumb.size>2*1024*1024||!['image/webp','image/jpeg','image/png'].includes(display.type)||display.type!==thumb.type)return {ok:false,error:'photo-rules'};
 const checkSignature=async(file:File)=>{const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());return file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:file.type==='image/webp'?String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP':false;};
 if(!(await checkSignature(display))||!(await checkSignature(thumb)))return {ok:false,error:'photo-rules'};
 const {data:owner}=await supabase.from('listings').select('id').eq('id',id).maybeSingle();if(!owner)return {ok:false,error:'missing'};
 const {count}=await supabase.from('listing_images').select('id',{count:'exact',head:true}).eq('listing_id',id);if((count??0)+1>20)return {ok:false,error:'photo-limit'};
 const extension=display.type==='image/webp'?'webp':display.type==='image/png'?'png':'jpg';const objectId=randomUUID();const folder=`listings/${id}/${objectId}`;const displayPath=`${folder}.${extension}`;const thumbPath=`${folder}-t.${extension}`;
 const uploadWithRetry=async(path:string,file:File)=>{for(let attempt=0;attempt<3;attempt++){const result=await supabase.storage.from('listing-media').upload(path,file,{contentType:file.type,upsert:false});if(!result.error)return true;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,250*2**attempt));}return false;};
 if(!(await uploadWithRetry(displayPath,display)))return {ok:false,error:'upload'};
 if(!(await uploadWithRetry(thumbPath,thumb))){await supabase.storage.from('listing-media').remove([displayPath]);return {ok:false,error:'upload'};}
 const {count:existing}=await supabase.from('listing_images').select('id',{count:'exact',head:true}).eq('listing_id',id);
 const {error}=await supabase.from('listing_images').insert({listing_id:id,storage_path:displayPath,thumb_path:thumbPath,width,height,blur_data_url:blurData,alt_text:altText,sort_order:existing??0,is_cover:(existing??0)===0});
 if(error){await supabase.storage.from('listing-media').remove([displayPath,thumbPath]);return {ok:false,error:'metadata'};}
 revalidatePath(`/admin/listings/${id}/edit`);return {ok:true};
}export async function manageListingImage(form:FormData){
  const {supabase}=await requireAdmin();const id=String(form.get('id')||'');const imageId=String(form.get('image_id')||'');const operation=String(form.get('operation')||'');
  const {data:image}=await supabase.from('listing_images').select('id,storage_path,thumb_path,listing_id,sort_order').eq('id',imageId).eq('listing_id',id).maybeSingle();if(!image)redirect(`/admin/listings/${id}/edit?error=image`);
  if(operation==='move-up'||operation==='move-down'){
    const {data:all,error}=await supabase.from('listing_images').select('id,sort_order').eq('listing_id',id).order('sort_order');if(error)redirect(`/admin/listings/${id}/edit?error=image`);
    const position=all?.findIndex(row=>row.id===image.id)??-1;const neighbor=all?.[position+(operation==='move-up'?-1:1)];
    if(neighbor){const first=await supabase.from('listing_images').update({sort_order:neighbor.sort_order}).eq('id',image.id);if(first.error)redirect(`/admin/listings/${id}/edit?error=image`);const second=await supabase.from('listing_images').update({sort_order:image.sort_order}).eq('id',neighbor.id);if(second.error)redirect(`/admin/listings/${id}/edit?error=image`);}
  }else if(operation==='cover'){
    const clear=await supabase.from('listing_images').update({is_cover:false}).eq('listing_id',id);if(clear.error)redirect(`/admin/listings/${id}/edit?error=image`);const set=await supabase.from('listing_images').update({is_cover:true}).eq('id',image.id);if(set.error)redirect(`/admin/listings/${id}/edit?error=image`);
  }else if(operation==='delete'){
    const deleted=await supabase.from('listing_images').delete().eq('id',image.id);if(deleted.error){console.error('Image metadata delete failed',deleted.error.code);redirect(`/admin/listings/${id}/edit?error=image`);}const removed=await supabase.storage.from('listing-media').remove([image.storage_path,...(image.thumb_path?[image.thumb_path]:[])]);if(removed.error)console.error('Image object cleanup failed',removed.error.name);
    const {data:cover}=await supabase.from('listing_images').select('id').eq('listing_id',id).eq('is_cover',true).maybeSingle();if(!cover){const {data:first}=await supabase.from('listing_images').select('id').eq('listing_id',id).order('sort_order').limit(1).maybeSingle();if(first)await supabase.from('listing_images').update({is_cover:true}).eq('id',first.id);}
  }else redirect(`/admin/listings/${id}/edit?error=image`);
  redirect(`/admin/listings/${id}/edit?photos=updated`);
}export async function updateEnquiryStatus(form:FormData){const {supabase}=await requireAdmin();const id=String(form.get('id')||'');const status=String(form.get('status')||'');if(!z.enum(['new','contacted','inspection_arranged','closed','spam']).safeParse(status).success)redirect('/admin/enquiries?error=status');const {error}=await supabase.from('enquiries').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)redirect('/admin/enquiries?error=save');redirect('/admin/enquiries?saved=1');}

const settingsOptionalText=(max:number)=>z.string().trim().max(max).optional();
const settingsSchema=z.object({brand_name:z.string().trim().min(1).max(80),tagline:settingsOptionalText(160),realtor_name:settingsOptionalText(100),realtor_bio:settingsOptionalText(2000),whatsapp_number:settingsOptionalText(40),phone:settingsOptionalText(40),email:z.union([z.string().email().max(254),z.literal('')]).optional(),office_address_public:settingsOptionalText(180),privacy_contact_email:z.union([z.string().email().max(254),z.literal('')]).optional(),short_let_enabled:z.enum(['on','yes']).optional(),cars_enabled:z.enum(['on','yes']).optional(),show_exact_address:z.enum(['on','yes']).optional(),auto_hide_stale:z.enum(['on','yes']).optional(),stale_after_days:z.string().regex(/^\d{1,3}$/),closed_listings_public_days:z.string().regex(/^\d{1,3}$/),enquiry_retention_days:z.string().regex(/^\d{1,4}$/),safety_tips:z.string().max(5000)});
export async function saveSiteSettings(form:FormData){const {supabase}=await requireAdmin();const parsed=settingsSchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect('/admin/settings?error=validation');const x=parsed.data;const whatsapp=x.whatsapp_number?normalizePhone(x.whatsapp_number):null;const phone=x.phone?normalizePhone(x.phone):null;if(x.whatsapp_number&&!whatsapp)redirect('/admin/settings?error=phone');if(x.phone&&!phone)redirect('/admin/settings?error=phone');const stale=Number(x.stale_after_days),closed=Number(x.closed_listings_public_days),retention=Number(x.enquiry_retention_days);if(stale<1||stale>365||closed>730||retention<30||retention>3650)redirect('/admin/settings?error=validation');const tips=x.safety_tips.split(/\r?\n/).map(tip=>tip.trim()).filter(Boolean).slice(0,10);if(tips.some(tip=>tip.length>500))redirect('/admin/settings?error=validation');const {error}=await supabase.from('site_settings').update({brand_name:x.brand_name,tagline:x.tagline||null,realtor_name:x.realtor_name||null,realtor_bio:x.realtor_bio||null,whatsapp_number:whatsapp,phone,email:x.email||null,office_address_public:x.office_address_public||null,privacy_contact_email:x.privacy_contact_email||null,short_let_enabled:Boolean(x.short_let_enabled),cars_enabled:Boolean(x.cars_enabled),show_exact_address:Boolean(x.show_exact_address),auto_hide_stale:Boolean(x.auto_hide_stale),stale_after_days:stale,closed_listings_public_days:closed,enquiry_retention_days:retention,safety_tips:tips,updated_at:new Date().toISOString()}).eq('id',true);if(error)redirect('/admin/settings?error=save');redirect('/admin/settings?saved=1');}
const locationSchema=z.object({operation:z.enum(['add','deactivate']),id:z.string().uuid().optional(),level:z.enum(['state','city','area','estate']).optional(),parent_id:z.union([z.literal(''),z.string().uuid()]).optional(),name:z.string().trim().min(2).max(80).optional()});
export async function manageLocation(form:FormData){const {supabase}=await requireAdmin();const parsed=locationSchema.safeParse(Object.fromEntries(form.entries()));if(!parsed.success)redirect('/admin/locations?error=validation');const value=parsed.data;if(value.operation==='deactivate'){if(!value.id)redirect('/admin/locations?error=validation');const {error}=await supabase.from('locations').update({is_active:false}).eq('id',value.id);if(error)redirect('/admin/locations?error=used');redirect('/admin/locations?saved=deactivated');}if(!value.level||!value.name)redirect('/admin/locations?error=validation');const slug=slugPart(value.name).slice(0,80);if(!slug)redirect('/admin/locations?error=validation');const {error}=await supabase.from('locations').insert({level:value.level,parent_id:value.parent_id||null,name:value.name,slug,is_active:true});if(error)redirect('/admin/locations?error=parent');redirect('/admin/locations?saved=added');}
export async function updateReportStatus(form:FormData){const {supabase}=await requireAdmin();const id=String(form.get('id')||'');const status=String(form.get('status')||'');if(!z.enum(['open','reviewed','dismissed']).safeParse(status).success)redirect('/admin/reports?error=status');const {error}=await supabase.from('listing_reports').update({status}).eq('id',id);if(error)redirect('/admin/reports?error=save');redirect('/admin/reports?saved=1');}
export async function purgeExpiredEnquiries(form:FormData){const {supabase}=await requireAdmin();const apply=form.get('apply')==='yes';const {data,error}=await supabase.rpc('purge_expired_enquiries',{p_dry_run:!apply});if(error)redirect('/admin/enquiries?error=purge');redirect(`/admin/enquiries?purge=${Number(data)||0}&applied=${apply?'1':'0'}`);}
