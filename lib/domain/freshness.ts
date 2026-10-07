export function freshness(input:{lastConfirmedAt:string|Date|null;now?:Date;staleAfterDays:number}):{kind:'unconfirmed'|'fresh'|'stale';days:number|null}{
 if(!input.lastConfirmedAt)return {kind:'unconfirmed',days:null};
 const now=input.now??new Date();const date=new Date(input.lastConfirmedAt);if(Number.isNaN(date.getTime()))return {kind:'unconfirmed',days:null};
 const days=Math.max(0,Math.floor((now.getTime()-date.getTime())/86_400_000));return {kind:days>input.staleAfterDays?'stale':'fresh',days};
}
