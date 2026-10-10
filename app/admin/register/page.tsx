import type {Metadata} from 'next';
import Link from 'next/link';
import {AdminRegistrationForm} from '@/components/admin/admin-registration-form';

export const metadata:Metadata={title:'Register invited admin',robots:{index:false,follow:false}};

export default async function RegisterAdmin({searchParams}:{searchParams:Promise<{error?:string}>}){
 const {error}=await searchParams;
 return <section className="wrap text-page"><p className="eyebrow">Private area · invited access</p><h1>Register as an admin.</h1><p>Admin accounts require an invitation from an existing administrator. Invitations are tied to one email, expire after seven days, and can only be used once.</p>{error==='configuration'&&<p className="notice" role="alert">Admin registration needs the live site URL configured before email confirmation can work.</p>}<AdminRegistrationForm/><p><Link href="/admin/login">Already registered? Sign in</Link></p></section>;
}
