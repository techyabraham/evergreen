import type {Listing} from '@/lib/types';

export function listingStructuredData(listing:Listing,canonicalUrl:string,brand:string){
 const location=[listing.public_location_label||listing.public_location||listing.area,listing.city,listing.state].filter(Boolean).join(', ');
 const active=['published','under_offer'].includes(listing.status);
 const availability=active?(listing.status==='under_offer'?'https://schema.org/LimitedAvailability':'https://schema.org/InStock'):'https://schema.org/OutOfStock';
 const offer=listing.price_on_request||listing.price_amount==null?undefined:{'@type':'Offer',price:Number(listing.price_amount),priceCurrency:listing.currency,availability,url:canonicalUrl};
 const product:Record<string,unknown>=listing.category==='vehicle'?{'@type':'Car',name:listing.title,description:listing.description.slice(0,500),brand:{'@type':'Brand',name:listing.vehicle_details?.make||brand},model:listing.vehicle_details?.model,vehicleModelDate:listing.vehicle_details?.year,offers:offer}:{'@type':'Product',name:listing.title,description:listing.description.slice(0,500),category:'Property',sku:listing.reference_code,brand:{'@type':'Brand',name:brand},offers:offer};
 if(location)product.contentLocation={'@type':'Place',name:location};
 const breadcrumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:new URL('/',canonicalUrl).toString()},{'@type':'ListItem',position:2,name:listing.category==='vehicle'?'Cars':'Property',item:new URL(listing.category==='vehicle'?'/cars':`/property-for-${listing.purpose==='short_let'?'short-let':listing.purpose}`,canonicalUrl).toString()},{'@type':'ListItem',position:3,name:listing.title,item:canonicalUrl}]};
 return [breadcrumbs,{'@context':'https://schema.org',...product,url:canonicalUrl,additionalProperty:[{'@type':'PropertyValue',name:'Reference',value:listing.reference_code}]}];
}
