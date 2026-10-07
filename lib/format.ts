export function formatPrice(amount: number | null, currency = 'NGN', period: string | null = 'one_time') {
  if (amount == null || period === 'price_on_request') return 'Price on request';
  const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  const suffix: Record<string, string> = { year: ' / year', month: ' / month', day: ' / day', one_time: '' };
  return `${formatted}${suffix[period ?? 'one_time'] ?? ''}`;
}
export function normalizeWhatsApp(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits=digits.slice(2);
  if (digits.startsWith('0') && digits.length===11) digits = `234${digits.slice(1)}`;
  if (digits.startsWith('234') && digits.length===13) return digits;
  return '';
}
export function whatsAppUrl(number: string | undefined, listing: { reference_code: string; title: string; public_location?: string | null }, action = 'ask about availability') {
  const digits = normalizeWhatsApp(number ?? '');
  if (!digits) return null;
  const message = `Hello, I would like to ${action} for ${listing.reference_code} — ${listing.title}${listing.public_location ? ` in ${listing.public_location}` : ''}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
