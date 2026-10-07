import Link from 'next/link';
export function Pagination({path,filters,page,hasMore}:{path:string;filters:Record<string,string|undefined>;page:number;hasMore:boolean}){
  const link=(target:number)=>{const params=new URLSearchParams();for(const [key,value]of Object.entries(filters))if(value&&key!=='page')params.set(key,value);if(target>1)params.set('page',String(target));const query=params.toString();return `${path}${query?`?${query}`:''}`;};
  if(page<=1&&!hasMore)return null;
  return <nav className="pagination" aria-label="Listing pages">{page>1?<Link href={link(page-1)}>← Previous page</Link>:<span/>}<span>Page {page}</span>{hasMore?<Link href={link(page+1)}>Next page →</Link>:<span/>}</nav>;
}
