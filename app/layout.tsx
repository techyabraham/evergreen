import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo, Header } from '@/components/header';
import './globals.css';

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Evergreen Global Properties';

export const metadata: Metadata = {
  title: { default: businessName, template: `%s · ${businessName}` },
  description: 'Browse property and vehicle listings from Evergreen Global Properties. Ask the realtor about availability and details.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <BrandLogo footer />
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/admin/login">Admin</Link>
          </div>
          <small>Listing details are provided by the realtor. Please confirm availability and all fees before proceeding.</small>
        </footer>
      </body>
    </html>
  );
}
