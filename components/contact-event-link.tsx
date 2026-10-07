'use client';
import type {AnchorHTMLAttributes,MouseEvent,ReactNode} from 'react';
type EventName='whatsapp_click'|'call_click'|'share_click';
export function ContactEventLink({reference,event,children,onClick,...props}:{reference:string;event:EventName;children:ReactNode}&AnchorHTMLAttributes<HTMLAnchorElement>){
 function track(e:MouseEvent<HTMLAnchorElement>){void fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ref:reference,event,sourcePath:window.location.pathname}),keepalive:true});onClick?.(e);}
 return <a {...props} onClick={track}>{children}</a>;
}
