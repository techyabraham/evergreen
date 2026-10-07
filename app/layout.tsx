import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import Link from 'next/link';
export const metadata: Metadata = { title: { default: 'Property, thoughtfully.', template: '%s · Property, thoughtfully.' }, description: 'Browse property and vehicle listings. Ask the realtor about availability and details.', metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Header/><main>{children}</main><footer className="site-footer"><Link className="wordmark" href="/">{process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Property, thoughtfully.'}</Link><div><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link><Link href="/admin/login">Admin</Link></div><small>Listing details are provided by the realtor. Please confirm availability and all fees before proceeding.</small></footer></body></html>; }
