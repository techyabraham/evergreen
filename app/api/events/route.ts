import {NextResponse,type NextRequest} from 'next/server';
import {z} from 'zod';
import {logPublicContactEvent} from '@/lib/data/public-submissions';
import {hashIp} from '@/lib/security/ip-hash';
const eventSchema=z.object({ref:z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/),event:z.enum(['whatsapp_click','call_click','form_submit','share_click']),sourcePath:z.string().max(500).optional()});
export async function POST(request:NextRequest){
 if(Number(request.headers.get('content-length')||0)>2048)return new NextResponse(null,{status:413});
 const origin=request.headers.get('origin');if(!origin)return new NextResponse(null,{status:403});try{if(new URL(origin).host!==request.headers.get('host'))return new NextResponse(null,{status:403});}catch{return new NextResponse(null,{status:403});}
 let body:unknown;try{body=await request.json();}catch{return new NextResponse(null,{status:400});}
 const parsed=eventSchema.safeParse(body);if(!parsed.success)return new NextResponse(null,{status:400});
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 await logPublicContactEvent(parsed.data.ref,parsed.data.event,parsed.data.sourcePath||'',hashIp(ip));
 return new NextResponse(null,{status:204});
}
