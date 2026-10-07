import type { MetadataRoute } from 'next';
import { getListings } from '@/lib/data';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const fixed=['','/properties','/cars','/about','/contact','/privacy'].map(path=>({url:`${base}${path}`,lastModified:new Date()}));const listings=await getListings({},500);return [...fixed,...listings.map(item=>({url:`${base}/${item.category==='vehicle'?'cars':'properties'}/${item.slug}`,lastModified:new Date(item.updated_at)}))];}
