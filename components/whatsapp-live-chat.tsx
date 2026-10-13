'use client';

import { usePathname } from 'next/navigation';
import { BUSINESS_CONTACTS, businessWhatsAppUrl, GENERAL_WHATSAPP_MESSAGE } from '@/lib/domain/business-contacts';

export function WhatsAppLiveChat() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <details className="whatsapp-live-chat">
      <summary aria-label="Open WhatsApp contact options">
        <span className="whatsapp-live-chat-icon" aria-hidden="true">◉</span>
        <span>Chat on WhatsApp</span>
      </summary>
      <div className="whatsapp-live-chat-panel">
        <p>Choose a contact line to start a WhatsApp conversation.</p>
        {BUSINESS_CONTACTS.map((contact) => (
          <a key={contact.tel} href={businessWhatsAppUrl(contact.whatsapp, GENERAL_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
            <span>WhatsApp</span><strong>{contact.display}</strong><span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </details>
  );
}
