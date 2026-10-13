import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo, Header } from '@/components/header';
import { BusinessContactOptions } from '@/components/business-contact-options';
import { WhatsAppLiveChat } from '@/components/whatsapp-live-chat';
import './globals.css';
import './admin/admin.css';
import './mobile.css';

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Evergreen Global Properties';

export const metadata: Metadata = {
  title: { default: businessName, template: `%s · ${businessName}` },
  description: 'Find homes to rent or buy in Ibadan, Lagos, and Abuja with Evergreen Global Properties. Explore properties and get local guidance in each city.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <BrandLogo footer />
          <nav className="footer-links" aria-label="Footer">
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/admin/login">Admin</Link>
          </nav>
          <section className="footer-contact" aria-label="Contact Evergreen Global Properties">
            <p>Speak directly with Evergreen</p>
            <BusinessContactOptions />
          </section>
          <small>Listing details are provided by the realtor. Please confirm availability and all fees before proceeding.</small>
        </footer>
        <WhatsAppLiveChat />
      </body>
    </html>
  );
}
