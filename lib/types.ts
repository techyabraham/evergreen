import type { Database } from '@/lib/supabase/database.types';
export type ListingStatus = Database['public']['Tables']['listings']['Row']['status'];
type PublicListingRow=Pick<Database['public']['Tables']['listings']['Row'],'id'|'slug'|'reference_code'|'category'|'purpose'|'title'|'description'|'price_amount'|'currency'|'price_period'|'negotiable'|'state'|'city'|'area'|'public_location'|'status'|'featured'|'last_confirmed_at'|'published_at'|'updated_at'>;
export type Listing = PublicListingRow & {property_details?:PropertyDetails|null;vehicle_details?:VehicleDetails|null;listing_images?:ListingImage[]};
export type PropertyDetails = { property_type: string; bedrooms: number | null; bathrooms: number | null; toilets: number | null; furnishing: string | null; rent_payment_frequency: string | null; agent_fee: number | null; agreement_fee: number | null; legal_fee: number | null; caution_fee: number | null; service_charge: number | null; amenities: string[] };
export type VehicleDetails = { make: string; model: string; trim: string | null; year: number | null; mileage: number | null; condition: string | null; import_status: string | null; transmission: string | null; fuel_type: string | null; colour: string | null };
export type ListingImage = { id: string; storage_path: string; alt_text: string; sort_order: number; is_cover: boolean; url?: string };
