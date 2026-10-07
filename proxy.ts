import {NextRequest} from 'next/server';
import {updateSession} from '@/lib/supabase/middleware';
export async function proxy(request:NextRequest){
  const nonce=btoa(crypto.randomUUID());
  const scriptSource=process.env.NODE_ENV==='development'?`'self' 'nonce-${nonce}' 'unsafe-eval' https://challenges.cloudflare.com`:`'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`;
  const policy=`default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; script-src ${scriptSource}; style-src 'self' 'unsafe-inline'${process.env.NODE_ENV==='production'?'; upgrade-insecure-requests':''}`;
  const requestHeaders=new Headers(request.headers);requestHeaders.set('x-nonce',nonce);requestHeaders.set('Content-Security-Policy',policy);
  const requestWithNonce=new NextRequest(request,{headers:requestHeaders});
  const response=await updateSession(requestWithNonce);response.headers.set('Content-Security-Policy',policy);return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
