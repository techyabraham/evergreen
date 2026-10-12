'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

export function MobileNavigation({ links }: { links: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);

  return <div className="mobile-menu" onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      trigger.current?.focus();
    }
  }}>
    <button ref={trigger} className="mobile-menu-toggle" type="button" aria-expanded={open} aria-controls={open ? 'mobile-site-navigation' : undefined} aria-label={open ? 'Close main navigation' : 'Open main navigation'} onClick={() => setOpen(value => !value)}>
      <span className="mobile-menu-icon" aria-hidden="true"><i/><i/><i/></span>
      <span>Menu</span>
    </button>
    {open && <nav id="mobile-site-navigation" className="mobile-menu-panel" aria-label="Mobile main navigation">
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}
    </nav>}
  </div>;
}
