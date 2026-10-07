import {normalizePhone} from './phone';
export function buildWhatsAppUrl(args:{businessNumber?:string|null;message:string}):string|null{const digits=normalizePhone(args.businessNumber??'');if(!digits)return null;return `https://wa.me/${digits}?text=${encodeURIComponent(args.message.slice(0,700))}`;}
export function listingMessage(args:{brand:string;title:string;ref:string;area?:string|null;city?:string|null;priceText:string;url:string;intent?:'availability'|'inspection'}):string{
 const action=args.intent==='inspection'?'arrange an inspection for':'check availability of';
 const place=[args.area,args.city].filter(Boolean).join(', ');
 const template=`Hello ${args.brand}, I'd like to ${action} ${args.title}${place?` (${place})`:''} – ${args.priceText}. Ref: ${args.ref}. ${args.url}`;
 return template.length<=700?template:`${template.slice(0,Math.max(0,697-args.url.length))}… ${args.url}`.slice(0,700);
}
