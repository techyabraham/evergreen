export const BUSINESS_CONTACTS = [
  { display: '0708 665 9178', tel: '+2347086659178', whatsapp: '2347086659178' },
  { display: '0703 248 7829', tel: '+2347032487829', whatsapp: '2347032487829' },
] as const;

export const GENERAL_WHATSAPP_MESSAGE = 'Hello Evergreen Global Properties, I would like to discuss my property needs.';

export function businessWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message.slice(0, 700))}`;
}
