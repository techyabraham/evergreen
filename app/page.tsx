import Image from 'next/image';
import Link from 'next/link';
import { getListings } from '@/lib/data';
import { ListingCard } from '@/components/listing-card';

export default async function Home() {
  const listings = await getListings({ category: 'property', city: 'Ibadan' }, 6);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="hero-kicker"><span /> Ibadan property, with a better point of view</p>
            <h1>Make your next move <em>matter.</em></h1>
            <p className="hero-description">
              Find a home that fits the way you want to live. Explore rentals and homes for sale across Ibadan, with a local team ready to help.
            </p>
            <form action="/property-for-rent" className="hero-search">
              <label htmlFor="home-search">Where in Ibadan?</label>
              <div className="hero-search-row">
                <input id="home-search" name="q" aria-label="Search by area or property" placeholder="Try Bodija, Akobo, Jericho…" />
                <button className="hero-search-button" type="submit">Find a home <span aria-hidden="true">↗</span></button>
              </div>
            </form>
            <div className="hero-intents" aria-label="Explore property options">
              <Link href="/property-for-rent">I’m looking to rent <span aria-hidden="true">→</span></Link>
              <Link href="/property-for-sale">I’m looking to buy <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="home-hero-visual">
            <Image
              className="home-hero-photo"
              src="/ibadan-property-hero.jpg"
              alt="Contemporary high-rise architecture framed by mature trees at dusk"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
            />
            <div className="hero-image-wash" />
            <div className="hero-location-card">
              <span className="location-icon" aria-hidden="true">✳</span>
              <span><strong>Rooted in Ibadan</strong><small>Local knowledge. Personal service.</small></span>
              <span className="location-arrow" aria-hidden="true">↗</span>
            </div>
            <span className="hero-image-index" aria-hidden="true">01 / FIND YOUR PLACE</span>
          </div>
          <div className="hero-orbit" aria-hidden="true">A BETTER<br />WAY HOME</div>
        </div>
        <div className="hero-bottomline"><span>Find a place to belong.</span><span>Ibadan · Oyo State · Nigeria</span></div>
      </section>

      <section className="pathways home-pathways">
        <div className="wrap pathway-grid">
          <Link className="pathway pathway-rent" href="/property-for-rent"><span className="pathway-number">01 / RENT</span><b>Find your next home <span>↗</span></b><span className="muted">Well-presented homes for the way you live.</span></Link>
          <Link className="pathway pathway-buy" href="/property-for-sale"><span className="pathway-number">02 / BUY</span><b>Make it yours <span>↗</span></b><span className="muted">Explore places to put down roots in Ibadan.</span></Link>
          <Link className="pathway pathway-cars" href="/cars"><span className="pathway-number">03 / MORE</span><b>Explore vehicles <span>↗</span></b><span className="muted">A considered selection, all in one place.</span></Link>
        </div>
      </section>

      <section className="wrap section home-collection">
        <div className="section-head">
          <div><p className="eyebrow">A fresh start, close to home</p><h2>Property in the spotlight</h2></div>
          <Link href="/property-for-rent">Explore all homes <span aria-hidden="true">↗</span></Link>
        </div>
        {listings.length ? <div className="cards">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : (
          <div className="empty-state home-empty-state">
            <span className="empty-spark" aria-hidden="true">✳</span>
            <p className="eyebrow">Your next chapter starts here</p>
            <h2>Tell us what home looks like to you.</h2>
            <p>Share the area, budget, and kind of place you have in mind. Our Ibadan team can help you find the right fit.</p>
            <Link className="button" href="/request">Let’s find your place <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </section>
    </>
  );
}
