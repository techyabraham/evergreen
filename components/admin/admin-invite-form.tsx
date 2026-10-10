'use client';

import {useActionState,useState} from 'react';
import {createAdminInvite,type AdminInviteState} from '@/app/actions';

const initialState:AdminInviteState={};

export function AdminInviteForm(){
 const [state,action,pending]=useActionState(createAdminInvite,initialState);const [copied,setCopied]=useState(false);
 const link=state.inviteToken?`/admin/register#invite=${encodeURIComponent(state.inviteToken)}`:'';
 async function copyLink(){if(!link)return;await navigator.clipboard.writeText(`${window.location.origin}${link}`);setCopied(true);}
 return <section className="admin-invite-panel"><h2>Invite an admin</h2><p>Only the invited email can use the link. It expires in seven days and works once.</p>
  <form action={action} className="listing-form"><div className="field"><label htmlFor="invite-email">New admin’s email</label><input id="invite-email" name="email" type="email" maxLength={254} required autoComplete="email"/></div><button className="button" disabled={pending}>{pending?'Creating invitation…':'Create invitation'}</button></form>
  {state.error&&<p className="notice" role="alert">{state.error==='invalid'?'Enter a valid email address.':'The invitation could not be created. Check that the database migration is applied and try again.'}</p>}
  {link&&<div className="notice" role="status"><p>Send this private link to <strong>{state.email}</strong>. The new admin must register with that exact email.</p><label htmlFor="admin-invite-link">Invitation link</label><input id="admin-invite-link" readOnly value={link}/><button className="button button-secondary" type="button" onClick={copyLink}>{copied?'Copied':'Copy full invitation link'}</button></div>}
 </section>;
}
