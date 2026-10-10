import {z} from 'zod';

const optionalText=(max:number)=>z.string().trim().max(max).optional();
const optionalInteger=(maxDigits:number)=>z.union([z.literal(''),z.string().regex(new RegExp(`^\\d{1,${maxDigits}}$`))]).optional();
const optionalMoney=z.union([z.literal(''),z.string().regex(/^\d{1,14}(?:\.\d{1,2})?$/)]).optional();

export const enquirySchema=z.object({
  name:z.string().trim().min(2).max(100),
  phone:z.string().trim().max(32).optional(),
  email:z.union([z.string().email().max(254),z.literal('')]).optional(),
  message:z.string().trim().min(5).max(1000),
  preferred_contact:z.enum(['phone','email','whatsapp']),
  listing_reference:optionalText(40),
  consent:z.literal('yes'),
}).refine(value=>!!(value.phone||value.email),{message:'Add a phone number or email address.'}).refine(value=>!value.phone||/^[+()\d\s-]{7,32}$/.test(value.phone),{message:'Enter a valid phone number.'});

export const listingInputSchema=z.object({
  category:z.enum(['property','vehicle']),purpose:z.enum(['rent','sale','short_let']),title:z.string().trim().min(5).max(140),description:z.string().trim().max(5000),
  price_amount:optionalMoney,price_period:z.enum(['year','month','day','one_time','price_on_request']),state:optionalText(80),city:optionalText(80),area:optionalText(100),
  location_id:z.union([z.literal(''),z.string().uuid()]).optional(),public_location_label:optionalText(120),
  status:z.enum(['draft','published','under_offer','rented','sold','archived']),last_confirmed_at:optionalText(40),property_type:optionalText(80),
  bedrooms:optionalInteger(3),bathrooms:optionalInteger(3),agent_fee:optionalMoney,agreement_fee:optionalMoney,legal_fee:optionalMoney,caution_fee:optionalMoney,service_charge:optionalMoney,
  rent_payment_frequency:optionalText(40),furnishing:optionalText(40),amenities:optionalText(300),make:optionalText(60),model:optionalText(60),year:optionalInteger(4),mileage:optionalInteger(10),
  condition:optionalText(40),import_status:optionalText(40),transmission:optionalText(40),fuel_type:optionalText(40),colour:optionalText(40),vehicle_class:z.union([z.literal(''),z.enum(['car','suv','truck','bus','van','motorcycle','tricycle','commercial','other'])]).optional(),
  fee_agency_state:z.enum(['known','not_applicable','unknown']).optional(),fee_agreement_legal_state:z.enum(['known','not_applicable','unknown']).optional(),fee_caution_state:z.enum(['known','not_applicable','unknown']).optional(),fee_service_state:z.enum(['known','not_applicable','unknown']).optional(),fee_service_frequency:z.enum(['one_time','year','month']).optional(),fees_acknowledged:z.enum(['on','yes']).optional(),relist_note:optionalText(500),advance_rent_months:optionalInteger(2),exact_address:optionalText(240),owner_name:optionalText(120),owner_phone:optionalText(32),vin:optionalText(40),internal_notes:optionalText(2000),title_type:optionalText(40),
}).superRefine((value,ctx)=>{
  if(value.category==='vehicle'&&value.purpose!=='sale')ctx.addIssue({code:'custom',path:['purpose'],message:'Vehicles can only be listed for sale.'});
  // Price and category-specific facts are optional. Empty price is saved as “on request”.
  if(value.price_amount&&value.purpose==='rent'&&value.price_period!=='price_on_request'&&!['year','month'].includes(value.price_period))ctx.addIssue({code:'custom',path:['price_period'],message:'Rent must be priced per year or month.'});
  if(value.price_amount&&value.purpose==='short_let'&&value.price_period!=='price_on_request'&&value.price_period!=='day')ctx.addIssue({code:'custom',path:['price_period'],message:'Short let must be priced per night.'});
  if(value.price_amount&&value.purpose==='sale'&&value.price_period!=='price_on_request'&&value.price_period!=='one_time')ctx.addIssue({code:'custom',path:['price_period'],message:'Sale price must be one-time.'});
  if(value.category==='vehicle'&&value.year&&Number(value.year)<1900)ctx.addIssue({code:'custom',path:['year'],message:'Enter a valid vehicle year.'});
  for(const field of ['bedrooms','bathrooms'] as const){if(value[field]&&Number(value[field])>100)ctx.addIssue({code:'custom',path:[field],message:'Enter a value between 0 and 100.'});}
  if(value.mileage&&Number(value.mileage)>2_147_483_647)ctx.addIssue({code:'custom',path:['mileage'],message:'Enter a valid mileage.'});
  if(value.last_confirmed_at&&Number.isNaN(Date.parse(value.last_confirmed_at)))ctx.addIssue({code:'custom',path:['last_confirmed_at'],message:'Choose a valid confirmation date.'});
});

export type SearchFilters={q?:string;category?:'property'|'vehicle';purpose?:'rent'|'sale'|'short_let';state?:string;city?:string;area?:string;min?:string;max?:string;sort?:'newest'|'price_asc'|'price_desc'|'beds_desc';property_type?:string;bedrooms?:string; bathrooms?:string;furnishing?:string;amenity?:string;make?:string;model?:string;vehicle_class?:string;year_min?:string;year_max?:string;condition?:string;import_status?:string;transmission?:string;fuel_type?:string;page?:string;serviced?:string;new?:string};
const filtersSchema=z.object({q:optionalText(100),category:z.enum(['property','vehicle']).optional(),purpose:z.enum(['rent','sale','short_let']).optional(),state:optionalText(80),city:optionalText(80),area:optionalText(100),min:z.string().regex(/^\d{1,16}$/).optional(),max:z.string().regex(/^\d{1,16}$/).optional(),sort:z.enum(['newest','price_asc','price_desc','beds_desc']).optional(),property_type:optionalText(200),bedrooms:z.string().regex(/^\d{1,2}$/).optional(),bathrooms:z.string().regex(/^\d{1,2}$/).optional(),serviced:z.enum(['true']).optional(),new:z.enum(['true']).optional(),furnishing:optionalText(80),amenity:z.enum(['parking','generator','security','borehole','swimming_pool','gym','balcony','elevator','pet_friendly','gated_estate','security_24h','cctv','standby_generator','solar_inverter','borehole_water','water_treatment','fast_internet','street_lights','drainage_system','all_rooms_ensuite','pop_ceiling','fitted_kitchen','fitted_wardrobes','fitted_ac','tiled_floors','big_compound','garden','parking_space','supermarket_nearby','good_road_access','near_public_transport','school_nearby']).optional(),make:optionalText(60),model:optionalText(60),vehicle_class:z.enum(['car','suv','truck','bus','van','motorcycle','tricycle','commercial','other']).optional(),year_min:z.string().regex(/^\d{4}$/).optional(),year_max:z.string().regex(/^\d{4}$/).optional(),condition:optionalText(80),import_status:optionalText(80),transmission:optionalText(40),fuel_type:optionalText(40),page:z.string().regex(/^\d{1,4}$/).optional()});
export function parseListingFilters(input:Record<string,string|string[]|undefined>):SearchFilters{const first=Object.fromEntries(Object.entries(input).map(([key,value])=>[key,Array.isArray(value)?value[0]:value]).filter(([,value])=>value!==''&&value!==undefined));const valid=Object.fromEntries(Object.entries(first).filter(([key,value])=>{const field=filtersSchema.shape[key as keyof typeof filtersSchema.shape];return field?.safeParse(value).success;}));const value=filtersSchema.parse(valid);if(value.min&&value.max&&Number(value.min)>Number(value.max)){delete value.min;delete value.max;}if(value.year_min&&value.year_max&&Number(value.year_min)>Number(value.year_max)){delete value.year_min;delete value.year_max;}return value;}
