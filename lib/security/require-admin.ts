import 'server-only';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

export async function requireAdmin(){
 const supabase=await createClient();if(!supabase)redirect('/admin/login?error=configuration');
 const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/admin/login');
 const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(profile?.role!=='admin')redirect('/admin/login?error=unauthorized');
 return {supabase,user};
}
