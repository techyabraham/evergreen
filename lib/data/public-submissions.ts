import 'server-only';
import {createServiceClient} from '@/lib/security/service-client';

export async function submitPublicEnquiry(payload:Record<string,unknown>){const client=createServiceClient();if(!client)return {ok:false as const,code:'UNAVAILABLE'};const {data,error}=await client.rpc('submit_enquiry',{p:payload});if(error)return {ok:false as const,code:'UNAVAILABLE'};return data as {ok:boolean;code?:string};}
export async function submitPublicReport(payload:Record<string,unknown>){const client=createServiceClient();if(!client)return {ok:false as const,code:'UNAVAILABLE'};const {data,error}=await client.rpc('submit_listing_report',{p:payload});if(error)return {ok:false as const,code:'UNAVAILABLE'};return data as {ok:boolean;code?:string};}
export async function logPublicContactEvent(reference:string,event:string,sourcePath:string,ipHash:string|null){const client=createServiceClient();if(!client)return;await client.rpc('log_contact_event',{p_listing_ref:reference,p_event:event,p_source_path:sourcePath,p_ip_hash:ipHash});}
