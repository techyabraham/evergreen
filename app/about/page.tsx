import type { Metadata } from 'next';
import { BusinessContactOptions } from '@/components/business-contact-options';

export const metadata: Metadata = {
  title: 'About Evergreen Global Properties',
  description: 'Learn about Evergreen Global Properties and its real estate services.',
};

const services = [
  { title: 'Property sales & purchases', text: 'Support for the decisions involved in buying or selling a property.' },
  { title: 'Rentals', text: 'Guidance for people looking to rent a property.' },
  { title: 'Property & site management', text: 'Professional property management and site management services.' },
  { title: 'Investment advisory', text: 'Real estate investment advisory for considered property decisions.' },
];

export default function About() {
  return (
    <article className="wrap about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <p className="eyebrow">Evergreen Global Properties</p>
          <h1 id="about-title">Your trusted partner in real estate.</h1>
          <p className="about-lead">
            Evergreen Global Properties is a real estate company offering professional services in property sales,
            purchases, rentals, property management, site management, and real estate investment advisory.
          </p>
        </div>
        <div className="about-hero-note">
          <span className="about-mark" aria-hidden="true">E</span>
          <p>Reliable service, built around the real estate decisions that matter to you.</p>
          <span className="about-rule" aria-hidden="true" />
          <small>Evergreen Global Properties</small>
        </div>
      </section>

      <section className="about-services" aria-labelledby="about-services-title">
        <div className="about-section-heading">
          <p className="eyebrow">How we can help</p>
          <h2 id="about-services-title">Real estate, considered from every angle.</h2>
        </div>
        <div className="about-service-grid">
          {services.map((service, index) => (
            <article className="about-service-card" key={service.title}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-values" aria-labelledby="about-values-title">
        <div>
          <p className="eyebrow">What guides us</p>
          <h2 id="about-values-title">Integrity. Professionalism. Client satisfaction.</h2>
        </div>
        <p>We are committed to providing reliable services built on integrity, professionalism, and client satisfaction.</p>
      </section>

      <section className="about-contact" aria-labelledby="about-contact-title">
        <div>
          <p className="eyebrow">Let’s talk property</p>
          <h2 id="about-contact-title">Make your next real estate decision with a conversation.</h2>
          <p>Whether you want to buy, sell, rent, or manage a property, we are here to help you make the right real estate decisions.</p>
        </div>
        <BusinessContactOptions />
      </section>

      <p className="about-signoff">Evergreen Global Properties <span aria-hidden="true">—</span> Your Trusted Partner in Real Estate.</p>
    </article>
  );
}
