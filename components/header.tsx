import Image from 'next/image';
import Link from 'next/link';

const links = [
  ['Rent', '/property-for-rent'],
  ['Buy', '/property-for-sale'],
  ['Recently closed', '/recently-closed'],
  ['Vehicles', '/cars'],
  ['About', '/about'],
];

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Evergreen Global Properties';

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={footer ? 'brand-link brand-link-footer' : 'brand-link'} href="/" aria-label={`${businessName} home`}>
      <Image
        className="brand-logo"
        src="/evergreen-global-properties-logo.png"
        alt={businessName}
        width={2172}
        height={724}
        priority={!footer}
      />
    </Link>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <BrandLogo />
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">Menu</summary>
        <nav aria-label="Mobile main navigation">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
      </details>
      <Link className="nav-cta" href="/request">Get matched <span aria-hidden="true">↗</span></Link>
    </header>
  );
}

export { BrandLogo };
