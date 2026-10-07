import type {FeeRow} from './fees';
export type ReadinessInput={title:string;description:string;priceAmount:number|null;priceOnRequest:boolean;period:string|null;locationLevel?:'state'|'city'|'area'|'estate'|null;images:{isCover:boolean;altText:string}[];category:'property'|'vehicle';purpose:'rent'|'sale'|'short_let';propertyType?:string|null;bedrooms?:number|null;make?:string|null;model?:string|null;year?:number|null;mileage?:number|null;mileageUnit?:string|null;condition?:string|null;importStatus?:string|null;lastConfirmedAt?:string|null;fees?:FeeRow[];feesAcknowledged?:boolean;}
export function publishReadiness(input:ReadinessInput){const issues:{code:string;field:string;message:string}[]=[];const warnings:string[]=[];const add=(code:string,field:string,message:string)=>issues.push({code,field,message});
 if(input.title.trim().length<10)add('title_short','title','Use a title with at least 10 characters.');
 if(input.description.trim().length<80)add('description_short','description','Add at least 80 characters of accurate description.');
 if(!input.priceOnRequest&&(!(input.priceAmount&&input.priceAmount>0)||!input.period))add('price_required','priceAmount','Enter a price and period, or mark price on request.');
 if(!input.locationLevel||input.locationLevel==='state')add('location_required','location','Choose at least a city; an area is preferred.');
 if(input.images.length<3)add('photos_minimum','images','Add at least 3 photos before publishing.');
 if(input.images.filter(i=>i.isCover).length!==1)add('cover_required','images','Choose exactly one cover photo.');
 if(!input.images.find(i=>i.isCover)?.altText.trim())add('cover_alt_required','images','Add accurate alt text to the cover photo.');
 const bedroomsOptional=Boolean(input.propertyType&&(/land|commercial|office|shop|warehouse|co_working/.test(input.propertyType)));
 if(input.category==='property'&&(!input.propertyType||(!bedroomsOptional&&input.bedrooms==null)))add('property_details','propertyType','Add the required property type and bedroom count.');
 if(input.category==='vehicle'&&(!input.make||!input.model||!input.year||input.mileage===null||!input.mileageUnit||!input.condition||!input.importStatus))add('vehicle_details','vehicle','Complete make, model, year, mileage, condition, and import status.');
 if(!input.lastConfirmedAt)add('confirmation_required','lastConfirmedAt','Confirm availability before publishing.');
 if(['rent','short_let'].includes(input.purpose)&&!input.feesAcknowledged){for(const type of ['agency','agreement_legal','caution_deposit','service_charge'] as const){const row=input.fees?.find(f=>f.type===type);if(!row||row.state==='unknown')add('fee_unresolved',type,`Record ${type.replace('_',' ')} or explicitly acknowledge publishing with unknown fees.`);}}
 if(!input.description.trim()||input.description===input.description.toUpperCase())warnings.push('Review description casing and completeness.');
 if(input.images.length<6)warnings.push('Add more photos if available (recommended: 6 or more).');
 if(input.images.some(i=>!i.altText.trim()))warnings.push('Add accurate alt text to every photo.');
 return {ready:issues.length===0,issues,warnings};}
