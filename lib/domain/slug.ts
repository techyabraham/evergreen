const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function slugPart(value:string):string{return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function propertySlug(input:{title:string;referenceCode:string;beds?:number|null;type?:string|null;purpose:string;area?:string|null;city?:string|null}):string{
 const beds=input.beds?`${input.beds}-bedroom`:'';
 const base=[beds,slugPart(input.type||input.title),`for-${slugPart(input.purpose)}`,slugPart(input.area||''),slugPart(input.city||'')].filter(Boolean).join('-').replace(/-{2,}/g,'-').slice(0,80).replace(/-+$/,'');
 return `${base}-${input.referenceCode.toUpperCase()}`;
}
export function referenceCode(value:string):boolean{return new RegExp(`^[${alphabet}]{6}$`).test(value);}
export function parseRefFromSlug(value:string):{reference:string;slug:string}|null{const match=value.match(/-([A-HJ-NP-Z2-9]{6})$/);return match?{reference:match[1],slug:value.slice(0,-7)}:null;}
