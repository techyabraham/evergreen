import 'server-only';
import {createClient as createSupabaseClient} from '@supabase/supabase-js';

export function createServiceClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret) return null;
 return createSupabaseClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
