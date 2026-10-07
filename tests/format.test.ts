import { describe,expect,it } from 'vitest';
import { formatPrice,normalizeWhatsApp,whatsAppUrl } from '../lib/format';
import { enquirySchema,listingInputSchema,parseListingFilters } from '../lib/validation';
describe('listing display helpers',()=>{
  it('formats each supported period and price on request',()=>{expect(formatPrice(2500000,'NGN','year')).toContain('/ year');expect(formatPrice(250000,'NGN','month')).toContain('/ month');expect(formatPrice(20000,'NGN','day')).toContain('/ day');expect(formatPrice(25000000,'NGN','one_time')).not.toContain('/');expect(formatPrice(null,'NGN','price_on_request')).toBe('Price on request');});
  it('normalizes Nigerian WhatsApp numbers to international digits',()=>{expect(normalizeWhatsApp('+234 801-234-5678')).toBe('2348012345678');expect(normalizeWhatsApp('08012345678')).toBe('2348012345678');expect(normalizeWhatsApp('+1 202-555-0100')).toBe('');expect(normalizeWhatsApp('')).toBe('');});
  it('encodes listing-specific context without fabricating a number',()=>{const link=whatsAppUrl('08012345678',{reference_code:'PROP-01',title:'A home',public_location:'Ikeja'});expect(link).toContain('wa.me/2348012345678?text=');expect(decodeURIComponent(link!.split('text=')[1])).toContain('PROP-01');expect(whatsAppUrl(undefined,{reference_code:'X',title:'Y'})).toBeNull();});
});
describe('listing and enquiry validation',()=>{
  it('uses the first repeated filter, drops invalid values, and normalizes boundaries',()=>{expect(parseListingFilters({min:'300',max:'200',page:['2','3'],sort:'invalid'})).toEqual({page:'2'});expect(parseListingFilters({min:'0',bedrooms:'3',sort:'price_asc'})).toEqual({min:'0',bedrooms:'3',sort:'price_asc'});});
  it('requires category-specific fields and keeps vehicles sale-only',()=>{const base={category:'vehicle',purpose:'rent',title:'A listing',description:'',price_period:'price_on_request',status:'draft',make:'Toyota'};expect(listingInputSchema.safeParse(base).success).toBe(false);expect(listingInputSchema.safeParse({...base,purpose:'sale',model:'Camry'}).success).toBe(true);expect(listingInputSchema.safeParse({...base,category:'property',purpose:'rent',property_type:''}).success).toBe(false);});
  it('requires at least one contact channel and rejects malformed email',()=>{const base={name:'Ada Okafor',message:'Please call me',preferred_contact:'phone'};expect(enquirySchema.safeParse(base).success).toBe(false);expect(enquirySchema.safeParse({...base,email:'bad'}).success).toBe(false);expect(enquirySchema.safeParse({...base,phone:'08012345678'}).success).toBe(true);});
});
