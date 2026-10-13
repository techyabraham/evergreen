import { BUSINESS_CONTACTS, businessWhatsAppUrl, GENERAL_WHATSAPP_MESSAGE } from '@/lib/domain/business-contacts';
import { ContactEventLink } from '@/components/contact-event-link';

export function BusinessContactOptions({
  message = GENERAL_WHATSAPP_MESSAGE,
  reference,
  className = 'business-contact-options',
}: {
  message?: string;
  reference?: string;
  className?: string;
}) {
  return (
    <div className={className} aria-label="Call or WhatsApp Evergreen Global Properties">
      {BUSINESS_CONTACTS.map((contact) => (
        <div className="business-contact-option" key={contact.tel}>
          {reference ? (
            <ContactEventLink className="business-contact-call" href={`tel:${contact.tel}`} reference={reference} event="call_click">
              <span>Call</span><strong>{contact.display}</strong>
            </ContactEventLink>
          ) : (
            <a className="business-contact-call" href={`tel:${contact.tel}`}>
              <span>Call</span><strong>{contact.display}</strong>
            </a>
          )}
          {reference ? (
            <ContactEventLink className="business-contact-whatsapp" href={businessWhatsAppUrl(contact.whatsapp, message)} reference={reference} event="whatsapp_click" target="_blank" rel="noopener noreferrer">
              WhatsApp <span aria-hidden="true">↗</span>
            </ContactEventLink>
          ) : (
            <a className="business-contact-whatsapp" href={businessWhatsAppUrl(contact.whatsapp, message)} target="_blank" rel="noopener noreferrer">
              WhatsApp <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
