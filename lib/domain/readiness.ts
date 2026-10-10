import type {FeeRow} from './fees';
export type ReadinessInput={title:string;description:string;priceAmount:number|null;priceOnRequest:boolean;period:string|null;locationLevel?:'state'|'city'|'area'|'estate'|null;images:{isCover:boolean;altText:string}[];category:'property'|'vehicle';purpose:'rent'|'sale'|'short_let';propertyType?:string|null;bedrooms?:number|null;make?:string|null;model?:string|null;year?:number|null;mileage?:number|null;mileageUnit?:string|null;condition?:string|null;importStatus?:string|null;lastConfirmedAt?:string|null;fees?:FeeRow[];feesAcknowledged?:boolean;}
export function publishReadiness(input:ReadinessInput){const issues:{code:string;field:string;message:string}[]=[];const warnings:string[]=[];const add=(code:string,field:string,message:string)=>issues.push({code,field,message});
 if(input.title.trim().length<5)add('title_short','title','Add a listing title.');
 if(input.images.length<1)add('photos_minimum','images','Add at least 1 photo before publishing.');
 if(input.images.filter(i=>i.isCover).length!==1)add('cover_required','images','Choose exactly one cover photo.');
 if(!input.images.find(i=>i.isCover)?.altText.trim())add('cover_alt_required','images','Add accurate alt text to the cover photo.');
 if(!input.description.trim())warnings.push('Add a description when you have one.');
 if(!input.priceOnRequest&&input.priceAmount==null)warnings.push('Add a price when available.');
 if(!input.locationLevel)warnings.push('Add a location when known.');
 if(!input.lastConfirmedAt)warnings.push('Availability has not been confirmed.');
 if(input.category==='property'&&!input.propertyType)warnings.push('Property type has not been added.');
 if(input.category==='vehicle'&&(!input.make||!input.model))warnings.push('Vehicle make and model have not been added.');
 if(['rent','short_let'].includes(input.purpose)&&!input.feesAcknowledged&&(!input.fees||input.fees.some(row=>row.state==='unknown')))warnings.push('Some fees are not listed. Visitors should contact the realtor for fee details.');
 if(input.images.some(i=>!i.altText.trim()))warnings.push('Add accurate alt text to every photo.');
 return {ready:issues.length===0,issues,warnings};}
