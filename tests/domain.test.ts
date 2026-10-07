import {describe,expect,it} from 'vitest';
import {annualEquivalent,formatCompactNaira,formatNaira,formatPrice} from '../lib/domain/money';
import {resolveFees,type FeeRow} from '../lib/domain/fees';
import {normalizePhone} from '../lib/domain/phone';
import {buildWhatsAppUrl,listingMessage} from '../lib/domain/whatsapp';
import {parseQuery} from '../lib/domain/filters';
import {parseRefFromSlug,propertySlug,slugPart} from '../lib/domain/slug';
import {listingTransition} from '../lib/domain/status';
import {freshness} from '../lib/domain/freshness';
import {publishReadiness} from '../lib/domain/readiness';
import {parsePropertyRoute} from '../lib/domain/property-route';
import {listingStructuredData} from '../lib/domain/seo';

describe('money and fees',()=>{
 it('formats supported prices, periods and annual equivalents',()=>{
  expect(formatNaira(6_000_000)).toContain('6,000,000');expect(formatCompactNaira(1_200_000_000)).toBe('₦1.2B');
  expect(formatPrice({amount:2_500_000,period:'month',purpose:'rent'})).toContain('/ month');
  expect(formatPrice({amount:85_000_000,period:'one_time',purpose:'sale'})).not.toContain('/');
  expect(formatPrice({amount:null,period:null,onRequest:true})).toBe('Price on request');
  expect(annualEquivalent(2_500_000,'month')).toBe(30_000_000);
  expect(()=>formatNaira(Number.NaN)).toThrow(RangeError);
 });
 it('includes known rental fees, rounds percentages and excludes monthly service charge',()=>{
  const fees:FeeRow[]=[
   {type:'agency',state:'known',percentOfRent:10,frequency:'one_time'},
   {type:'agreement_legal',state:'known',amount:25_000,frequency:'one_time'},
   {type:'caution_deposit',state:'not_applicable'},
   {type:'service_charge',state:'known',amount:50_000,frequency:'month'},
  ];
  const result=resolveFees({amount:6_000_005,period:'year'},fees);
  expect(result.rentDueUpfront).toBe(6_000_005);expect(result.upfrontTotal).toBe(6_625_006);
  expect(result.excludedRecurring).toEqual(['Service charge (monthly)']);
  expect(result.lines[0]?.display).toMatchObject({kind:'amount',amount:600_001});
 });
 it('does not calculate totals when a required fee is unknown or missing',()=>{
  const result=resolveFees({amount:2_000_000,period:'month'},[
   {type:'agency',state:'known',amount:100_000,frequency:'one_time'},
   {type:'agreement_legal',state:'known',amount:100_000,frequency:'one_time'},
   {type:'caution_deposit',state:'unknown'},
   {type:'service_charge',state:'not_applicable'},
  ]);
  expect(result.upfrontTotal).toBeNull();expect(result.rentDueUpfront).toBeNull();expect(result.missingRequired).toContain('caution_deposit');
 });
});

describe('contact and URL helpers',()=>{
 it('normalizes local and international Nigerian numbers and rejects invalid values',()=>{
  for(const value of ['08031234567','0803 123 4567','+234 803 123 4567','2348031234567','8031234567','+2348031234567','(0803) 123-4567','+234 (0)803 123 4567','00234 803 123 4567'])expect(normalizePhone(value)).toBe('2348031234567');
  expect(normalizePhone('+44 7911 123456')).toBe('447911123456');expect(normalizePhone('+234 1 463 0000')).not.toBeNull();
  for(const value of ['','letters','123456789','0000000000','+44 123'])expect(normalizePhone(value)).toBeNull();
 });
 it('builds safe WhatsApp links and limits long messages',()=>{
  const message=listingMessage({brand:'Ọ̀rẹ́ & Co',title:'A #1 home',ref:'AB23CD',area:'Ìkòtun',city:'Lagos',priceText:'₦6,000,000 / year',url:'https://example.test/property/x-AB23CD'});
  expect(message).toContain('AB23CD');expect(message).toContain('Ìkòtun');
  expect(buildWhatsAppUrl({businessNumber:'08031234567',message})).toContain('https://wa.me/2348031234567?text=');
  expect(buildWhatsAppUrl({businessNumber:'',message})).toBeNull();
  expect(listingMessage({brand:'X',title:'A'.repeat(1200),ref:'AB23CD',priceText:'on request',url:'https://x.test'}).length).toBeLessThanOrEqual(700);
 });
 it('folds unicode slugs and extracts terminal reference codes',()=>{
  expect(slugPart('Ìkòtun')).toBe('ikotun');
  const slug=propertySlug({title:'Family home',referenceCode:'AB23CD',beds:3,type:'Detached Duplex',purpose:'rent',area:'Ìkòtun',city:'Lagos'});
  expect(parseRefFromSlug(slug)).toEqual({reference:'AB23CD',slug:slug.slice(0,-7)});
 });
 it('leniently parses query filters and normalizes ranges',()=>{
  expect(parseQuery({minPrice:'90',maxPrice:'10',page:'900',amenities:'cctv,invalid,cctv',q:'  home\nfor rent  '})).toEqual({filters:{minPrice:10,maxPrice:90,amenities:['cctv'],q:'homefor rent',sort:'newest',page:500},dropped:[]});
  expect(parseQuery({minPrice:'bad',page:'-2',sort:'hack'}).filters).toMatchObject({page:1,sort:'newest'});
 });
});

describe('listing lifecycle and freshness',()=>{
 it('enforces status transitions, purpose rules and relist notes',()=>{
  expect(listingTransition({from:'draft',to:'published',purpose:'rent'}).allowed).toBe(true);
  expect(listingTransition({from:'published',to:'sold',purpose:'rent'}).allowed).toBe(false);
  expect(listingTransition({from:'rented',to:'published',purpose:'rent'})).toMatchObject({allowed:false,requiresNote:true});
  expect(listingTransition({from:'rented',to:'published',purpose:'rent',note:'Owner reconfirmed'}).allowed).toBe(true);
 });
 it('marks freshness based on recorded confirmation only',()=>{
  const now=new Date('2026-10-07T00:00:00Z');
  expect(freshness({lastConfirmedAt:null,now,staleAfterDays:14}).kind).toBe('unconfirmed');
  expect(freshness({lastConfirmedAt:'2026-10-06T00:00:00Z',now,staleAfterDays:14})).toEqual({kind:'fresh',days:1});
  expect(freshness({lastConfirmedAt:'2026-09-22T00:00:00Z',now,staleAfterDays:14}).kind).toBe('stale');
 });
 it('blocks publish when required data is incomplete',()=>{
  const result=publishReadiness({title:'Short',description:'',priceAmount:null,priceOnRequest:false,period:null,locationLevel:null,images:[],category:'property',purpose:'rent'});
  expect(result.ready).toBe(false);expect(result.issues.map(issue=>issue.code)).toContain('photos_minimum');
 });
});

describe('indexable property route grammar',()=>{
 const locations=[{id:'state',parent_id:null,level:'state' as const,slug:'lagos',name:'Lagos'},{id:'city',parent_id:'state',level:'city' as const,slug:'lekki',name:'Lekki'},{id:'area',parent_id:'city',level:'area' as const,slug:'orchid',name:'Orchid'}];
 it('parses valid ordered path segments and canonicalizes casing',()=>{
  expect(parsePropertyRoute({purposeSlug:'PROPERTY-FOR-RENT',segments:['flat-apartment','in','lagos','lekki','orchid','3-bedroom','is-serviced'],knownTypes:['flat'],knownGroups:['flat-apartment'],locations})).toMatchObject({ok:true,filters:{purpose:'rent',group:'flat-apartment',bedrooms:3,feature:'is-serviced'},canonicalPath:'/property-for-rent/flat-apartment/in/lagos/lekki/orchid/3-bedroom/is-serviced'});
 });
 it('rejects unknown purposes, locations, types and misplaced segments',()=>{
  const base={knownTypes:['flat'],knownGroups:['flat-apartment'],locations};
  expect(parsePropertyRoute({purposeSlug:'property-for-sale',segments:['not-a-type'],...base})).toMatchObject({ok:false});
  expect(parsePropertyRoute({purposeSlug:'property-for-rent',segments:['in','unknown'],...base})).toMatchObject({ok:false});
  expect(parsePropertyRoute({purposeSlug:'property-for-rent',segments:['flat','is-new','in','lagos'],...base})).toMatchObject({ok:true,canonicalPath:'/property-for-rent/flat/in/lagos/is-new'});
 });
});

describe('structured data',()=>{
 it('uses accurate listing status/price and excludes private details',()=>{
  const listing={id:'id',slug:'slug',reference_code:'AB23CD',category:'property',purpose:'rent',title:'Three bedroom flat',description:'Verified by the realtor only.',price_amount:2_500_000,currency:'NGN',price_period:'month',price_on_request:false,negotiable:false,state:'Lagos',city:'Lekki',area:'Ikate',public_location:null,status:'under_offer',featured:false,last_confirmed_at:null,published_at:null,updated_at:'2026-10-07',property_details:{property_type:'flat',bedrooms:3},listing_private:{exact_address:'1 Private Street',owner_phone:'08000000000'}} as never;
  const json=JSON.stringify(listingStructuredData(listing,'https://example.test/property/flat-AB23CD','Brand'));
  expect(json).toContain('LimitedAvailability');expect(json).toContain('2500000');expect(json).toContain('BreadcrumbList');expect(json).not.toContain('Private Street');expect(json).not.toContain('08000000000');
 });
});
