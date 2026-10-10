import type {Metadata} from 'next';
import Link from 'next/link';
import {AdminInviteForm} from '@/components/admin/admin-invite-form';
import {requireAdmin} from '@/lib/security/require-admin';

export const metadata:Metadata={title:'Team access',robots:{index:false,follow:false}};

export default async function AdminTeam(){
 await requireAdmin();
 return <section className="wrap admin-page"><p className="eyebrow">Admin access</p><h1>Team access.</h1><p>Invite a person by email. Public registration never grants admin access.</p><nav className="admin-quick-links" aria-label="Admin navigation"><Link href="/admin">Overview</Link><Link href="/admin/settings">Settings</Link></nav><AdminInviteForm/></section>;
}
