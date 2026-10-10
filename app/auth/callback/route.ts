import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function GET(request:NextRequest){
 const url=new URL(request.url);const code=url.searchParams.get('code');
 if(!code)return NextResponse.redirect(new URL('/admin/login?error=callback',url.origin));
 const supabase=await createClient();if(!supabase)return NextResponse.redirect(new URL('/admin/login?error=configuration',url.origin));
 const {data,error}=await supabase.auth.exchangeCodeForSession(code);
 if(error||!data.user)return NextResponse.redirect(new URL('/admin/login?error=callback',url.origin));
 const {data:profile}=await supabase.from('profiles').select('role').eq('id',data.user.id).maybeSingle();
 if(profile?.role!=='admin')return NextResponse.redirect(new URL('/admin/login?error=unauthorized',url.origin));
 return NextResponse.redirect(new URL('/admin',url.origin));
}
