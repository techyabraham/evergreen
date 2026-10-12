'use client';

import {useActionState,useSyncExternalStore} from 'react';
import {registerAdmin,type AdminInviteState} from '@/app/actions';

function subscribe(callback:()=>void){window.addEventListener('hashchange',callback);return ()=>window.removeEventListener('hashchange',callback);}
function getInviteToken(){return new URLSearchParams(window.location.hash.slice(1)).get('invite')||'';}
function getInviteEmail(){return new URLSearchParams(window.location.hash.slice(1)).get('email')||'';}
export function AdminRegistrationForm(){
 const inviteToken=useSyncExternalStore(subscribe,getInviteToken,()=> '');
 const inviteEmail=useSyncExternalStore(subscribe,getInviteEmail,()=> '');
 const [state,action,pending]=useActionState(registerAdmin,{} as AdminInviteState);
 if(!/^[A-Za-z0-9_-]{40,60}$/.test(inviteToken))return <p className="notice" role="alert">Open the complete invitation link from an existing admin to register.</p>;
 return <form action={action} className="listing-form"><input type="hidden" name="invite" value={inviteToken}/>
  <div className="field"><label htmlFor="register-email">Invited email</label><input id="register-email" name="email" type="email" maxLength={254} required autoComplete="email" defaultValue={inviteEmail} readOnly={Boolean(inviteEmail)}/>{inviteEmail&&<small>This invitation is tied to this email. Contact the inviter if it needs to change.</small>}</div>
  <div className="field"><label htmlFor="register-password">Create password</label><input id="register-password" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password"/><small>Use at least 12 characters.</small></div>
  {state.error&&<p className="notice" role="alert">{state.error==='invalid'?'This invitation could not be validated. Open the latest complete link and enter the exact email it was sent to. Invitations expire after seven days and work once; ask the inviter for a new link if this one has expired or been used.':state.error==='email'?'Enter a valid email address, using the same address the invitation was sent to.':state.error==='password'?'Use a password between 12 and 128 characters.':state.error==='account-exists'?'An account already exists for this email. Try signing in, or contact the inviter if that account still needs admin access.':state.error==='service'?'The invitation could not be checked right now. Try again later or ask an existing admin to check the site configuration.':state.error==='signup'?'The invitation was accepted, but Supabase could not create the account. Check the password and email confirmation settings, then try again or ask the inviter for help.':state.error==='profile'?'The account was created, but admin access could not be confirmed. Contact an existing admin before trying again.':'Registration could not be completed.'}</p>}
  <button className="button" disabled={pending}>{pending?'Creating account…':'Register as invited admin'}</button>
 </form>;
}
