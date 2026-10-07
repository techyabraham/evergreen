export type RouteLocation={id:string;parent_id:string|null;level:'state'|'city'|'area'|'estate';slug:string;name:string};
export type RouteFilters={purpose:'rent'|'sale'|'short_let';group?:string;type?:string;location?:RouteLocation[];bedrooms?:number;feature?:'is-serviced'|'is-furnished'|'is-new'};
export function parsePropertyRoute(input:{purposeSlug:string;segments:string[];knownTypes:string[];knownGroups:string[];locations:RouteLocation[]}):{ok:true;filters:RouteFilters;canonicalPath:string}|{ok:false;notFound:true}{
 const purposes:Record<string,RouteFilters['purpose']>={'property-for-rent':'rent','property-for-sale':'sale','property-for-short-let':'short_let'};
 const purpose=purposes[input.purposeSlug.toLowerCase()];if(!purpose)return {ok:false,notFound:true};
 const segments=input.segments.map(segment=>segment.toLowerCase()).filter(Boolean);const filters:RouteFilters={purpose};const consumed=new Set<number>();
 const typeIndex=segments.findIndex(segment=>input.knownTypes.includes(segment)||input.knownGroups.includes(segment));if(typeIndex>=0){const slug=segments[typeIndex];if(input.knownTypes.includes(slug))filters.type=slug;else filters.group=slug;consumed.add(typeIndex);}
 const selected:RouteLocation[]=[];const inIndex=segments.indexOf('in');
 if(inIndex>=0){consumed.add(inIndex);let parent:string|null=null;let expected:RouteLocation['level']='state';let index=inIndex+1;while(index<segments.length&&selected.length<4){const location=input.locations.find(row=>row.slug===segments[index]&&row.level===expected&&(expected==='state'?row.parent_id===null:row.parent_id===parent));if(!location)break;selected.push(location);consumed.add(index);parent=location.id;expected=location.level==='state'?'city':location.level==='city'?'area':'estate';index++;}if(!selected.length)return {ok:false,notFound:true};filters.location=selected;}
 for(let index=0;index<segments.length;index++){if(consumed.has(index))continue;const segment=segments[index];const bedroom=segment.match(/^(1|2|3|4)-bedroom$|^(5)-bedroom-and-above$/);if(bedroom&&!filters.bedrooms){filters.bedrooms=Number(bedroom[1]||bedroom[2]);consumed.add(index);continue;}if(['is-serviced','is-furnished','is-new'].includes(segment)&&!filters.feature){filters.feature=segment as RouteFilters['feature'];consumed.add(index);}}
 if(consumed.size!==segments.length)return {ok:false,notFound:true};
 const canonicalSegments=[filters.type||filters.group,...(selected.length?['in',...selected.map(row=>row.slug)]:[]),filters.bedrooms?(filters.bedrooms===5?'5-bedroom-and-above':`${filters.bedrooms}-bedroom`):undefined,filters.feature].filter((part):part is string=>Boolean(part));
 const canonicalPath=`/${input.purposeSlug.toLowerCase()}${canonicalSegments.length?`/${canonicalSegments.join('/')}`:''}`;
 return {ok:true,filters,canonicalPath};
}
