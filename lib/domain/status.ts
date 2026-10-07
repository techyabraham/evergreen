export type ListingState='draft'|'published'|'under_offer'|'rented'|'sold'|'archived';
const transitions:Record<ListingState,ListingState[]>={draft:['published','archived'],published:['under_offer','rented','sold','archived','draft'],under_offer:['published','rented','sold','archived'],rented:['archived','published'],sold:['archived','published'],archived:['draft']};
export function listingTransition(input:{from:ListingState;to:ListingState;purpose:'rent'|'sale'|'short_let';note?:string}){
 const relisting=(input.from==='rented'||input.from==='sold')&&input.to==='published';
 let allowed=transitions[input.from].includes(input.to);
 if(input.to==='rented'&&!['rent','short_let'].includes(input.purpose))allowed=false;
 if(input.to==='sold'&&input.purpose!=='sale')allowed=false;
 if(relisting&&!input.note?.trim())allowed=false;
 return {allowed,requiresNote:relisting,sideEffects:allowed?['status_changed_at',...(input.to==='published'?['published_at']:[]),...(input.to==='rented'?['rented_at']:[]),...(input.to==='sold'?['sold_at']:[]),...(input.from==='published'||input.from==='under_offer'||input.to==='published'?['revalidate_public']:[])]:[]};
}
