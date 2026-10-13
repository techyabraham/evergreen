import type { Metadata } from 'next';
import Link from 'next/link';
import { submitEnquiry } from '@/app/actions';
import { BusinessContactOptions } from '@/components/business-contact-options';

export const metadata: Metadata = { title: 'Contact', description: 'Contact Evergreen Global Properties about a property, vehicle or search.' };

export default async function Contact({ searchParams }: { searchParams: Promise<{ listing?: string; sent?: string; error?: string }> }) {
  const { listing, sent, error } = await searchParams;
  return (
    <section className="wrap text-page contact-page">
      <p className="eyebrow">Contact</p>
      <h1>Start a conversation.</h1>
      <p>Share a listing reference or describe what you are looking for. Choose a direct contact line or send an enquiry below.</p>

      <section className="contact-direct" aria-labelledby="contact-direct-title">
        <div>
          <p className="eyebrow">Call or WhatsApp</p>
          <h2 id="contact-direct-title">Reach Evergreen directly.</h2>
        </div>
        <BusinessContactOptions message={listing ? `Hello Evergreen Global Properties, I’m enquiring about listing ${listing}.` : undefined} />
      </section>

      {sent && <p className="notice" role="status">Thanks for your enquiry. The realtor has received it.</p>}
      {error && <p className="notice" role="alert">{error === 'details' ? 'Add your name, message, and a valid phone number or email.' : error === 'listing' ? 'That listing reference is no longer active. You can still send a general enquiry.' : 'We could not submit your enquiry right now. Please try again shortly.'}</p>}

      <form action={submitEnquiry}>
        <input type="hidden" name="listing_reference" value={listing || ''} />
        <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" /></div>
        <div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" maxLength={32} autoComplete="tel" /></div>
        <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" maxLength={254} autoComplete="email" /></div>
        <div className="field"><label htmlFor="preferred_contact">Preferred reply</label><select id="preferred_contact" name="preferred_contact"><option value="phone">Phone</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></div>
        <div className="field"><label htmlFor="message">How can the realtor help?</label><textarea id="message" name="message" required minLength={5} maxLength={1000} defaultValue={listing ? `I’m enquiring about listing ${listing}. ` : ''} /></div>
        <div className="field honeypot" aria-hidden="true"><label htmlFor="website">Leave this blank</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className="consent"><input type="checkbox" name="consent" value="yes" required /> I agree that the realtor may use these details to respond to this enquiry. Read the <Link href="/privacy">privacy notice</Link>.</label>
        <button className="button">Send enquiry</button>
      </form>
    </section>
  );
}
