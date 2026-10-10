import {NextRequest} from 'next/server';
import {z} from 'zod';
import {vehicleClasses} from '@/lib/domain/vehicle-catalog';

const vpicTypes=[...new Set(vehicleClasses.flatMap(item=>item.vpicType?[item.vpicType]:[]))];
const isVpicType=(value:string)=>vpicTypes.some(item=>item===value);
const querySchema=z.object({kind:z.enum(['makes','models']),type:z.string().refine(isVpicType),q:z.string().trim().min(2).max(80).optional(),make:z.string().trim().min(2).max(80).optional(),year:z.string().regex(/^\d{4}$/).optional()});
type VpicItem={MakeName?:string;Make_Name?:string;Model_Name?:string;ModelName?:string};

export async function GET(request:NextRequest){
 const parsed=querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
 if(!parsed.success)return Response.json({items:[],error:'invalid_query'},{status:400});
 const query=parsed.data;
 if(query.kind==='makes'&&!query.q)return Response.json({items:[],source:'NHTSA vPIC',error:'type_two_characters'});
 if(query.kind==='models'&&!query.make)return Response.json({items:[],source:'NHTSA vPIC',error:'make_required'});
 const year=query.year?Number(query.year):null;
 if(year!==null&&(year<1900||year>new Date().getFullYear()+1))return Response.json({items:[],error:'invalid_year'},{status:400});
 const encodedType=encodeURIComponent(query.type);
 const endpoint=query.kind==='makes'
  ?`GetMakesForVehicleType/${encodedType}?format=json`
  :year!==null&&year>1995
   ?`GetModelsForMakeYear/make/${encodeURIComponent(query.make!)}/modelyear/${year}?format=json`
   :`GetModelsForMake/${encodeURIComponent(query.make!)}?format=json`;
 try{
  const response=await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/${endpoint}`,{headers:{accept:'application/json'},next:{revalidate:86400},signal:AbortSignal.timeout(9000)});
  if(!response.ok)return Response.json({items:[],source:'NHTSA vPIC',error:'catalog_unavailable'},{status:502});
  const payload=await response.json() as {Results?:VpicItem[]};
  const needle=(query.q||query.make||'').toLocaleLowerCase();
  const items=[...new Map((payload.Results||[]).map(row=>{
   const value=(query.kind==='makes'?(row.MakeName||row.Make_Name):(row.Model_Name||row.ModelName))?.trim()||'';
   return [value.toLocaleLowerCase(),value] as const;
  }).filter(([key,value])=>key&&value&&(query.kind==='models'||key.includes(needle)))).values()].sort((a,b)=>a.localeCompare(b));
  return Response.json({items:items.slice(0,500),source:'NHTSA vPIC',truncated:items.length>500,note:year!==null&&year<=1995?'Year-specific vPIC model suggestions cover 1996 onward; these suggestions may include models from other years.':undefined});
 }catch{
  return Response.json({items:[],source:'NHTSA vPIC',error:'catalog_unavailable'},{status:502});
 }
}
