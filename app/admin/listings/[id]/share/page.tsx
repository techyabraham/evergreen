import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {formatPrice} from '@/lib/domain/money';
import {requireAdmin} from '@/lib/security/require-admin';
import {ShareKit} from '@/components/admin/share-kit';

export const metadata:Metadata={title:'Listing share kit',robots:{index:false,follow:false}};
export default async function SharePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const {supabase}=await requireAdmin();const [{data:item},{data:settings}]=await Promise.all([supabase.from('listings').select('id,title,reference_code,purpose,price_amount,price_period,price_on_request,currency,area,city,state').eq('id',id).maybeSingle(),supabase.from('site_settings').select('brand_name').eq('id',true).maybeSingle()]);if(!item)notFound();const price=formatPrice({amount:item.price_amount==null?null:Number(item.price_amount),period:item.price_period as 'one_time'|'year'|'month'|'day'|null,onRequest:item.price_on_request,purpose:item.purpose});return <section className="wrap text-page"><p className="eyebrow">Admin · Share kit</p><h1>Prepare a listing card.</h1><p>Check these details before sharing. The card is generated in this browser and contains no contact or private address data.</p><div className="notice"><strong>{item.title}</strong><br/>{[item.area,item.city,item.state].filter(Boolean).join(', ')} · {price} · {item.reference_code}</div><ShareKit data={{brand:settings?.brand_name||'Your Brand',title:item.title,reference:item.reference_code,price,location:[item.area,item.city].filter(Boolean).join(', '),purpose:item.purpose.replace('_',' ')}}/><p><Link href={`/admin/listings/${id}/edit`}>Back to listing</Link></p></section>;}
