'use client';

import {useActionState,useSyncExternalStore} from 'react';
import {registerAdmin,type AdminInviteState} from '@/app/actions';

function subscribe(callback:()=>void){window.addEventListener('hashchange',callback);return ()=>window.removeEventListener('hashchange',callback);}
function getInviteToken(){return new URLSearchParams(window.location.hash.slice(1)).get('invite')||'';}
export function AdminRegistrationForm(){
 const inviteToken=useSyncExternalStore(subscribe,getInviteToken,()=> '');
 const [state,action,pending]=useActionState(registerAdmin,{} as AdminInviteState);
 if(!/^[A-Za-z0-9_-]{40,60}$/.test(inviteToken))return <p className="notice" role="alert">Open the complete invitation link from an existing admin to register.</p>;
 return <form action={action} className="listing-form"><input type="hidden" name="invite" value={inviteToken}/>
  <div className="field"><label htmlFor="register-email">Invited email</label><input id="register-email" name="email" type="email" maxLength={254} required autoComplete="email"/></div>
  <div className="field"><label htmlFor="register-password">Create password</label><input id="register-password" name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password"/><small>Use at least 12 characters.</small></div>
  {state.error&&<p className="notice" role="alert">{state.error==='invalid'?'This invitation is invalid, expired, already used, or belongs to another email. Ask the inviter for a new one.':'Registration could not be completed.'}</p>}
  <button className="button" disabled={pending}>{pending?'Creating account…':'Register as invited admin'}</button>
 </form>;
}
