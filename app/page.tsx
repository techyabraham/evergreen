import Image from 'next/image';
import Link from 'next/link';
import { getListings, getPublicSettings } from '@/lib/data';
import { ListingCard } from '@/components/listing-card';

const cities = [
  { name: 'Ibadan', state: 'Oyo', code: '01' },
  { name: 'Lagos', state: 'Lagos', code: '02' },
  { name: 'Abuja', state: 'FCT', code: '03' },
];

export default async function Home() {
  const [listings, settings] = await Promise.all([
    getListings({ category: 'property' }, 6),
    getPublicSettings(),
  ]);
  const shortLetEnabled = Boolean(settings?.short_let_enabled);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="hero-kicker"><span /> YOUR NEXT MOVE STARTS HERE</p>
            <h1>Find a home that <em>moves you.</em></h1>
            <p className="hero-description">
              Explore properties across Ibadan, Lagos and Abuja. Search at your pace, then speak directly with the realtor when something feels right.
            </p>

            <form action="/properties" method="get" className="home-search" aria-label="Search properties">
              <fieldset className="home-search-intents">
                <legend>What are you looking to do?</legend>
                <label><input type="radio" name="purpose" value="rent" defaultChecked/><span>Rent</span></label>
                <label><input type="radio" name="purpose" value="sale"/><span>Buy</span></label>
                {shortLetEnabled&&<label><input type="radio" name="purpose" value="short_let"/><span>Short let</span></label>}
              </fieldset>
              <div className="home-search-fields">
                <label className="home-search-location" htmlFor="home-search">Area, neighbourhood or keyword
                  <input id="home-search" name="q" type="search" placeholder="Try Bodija, Lekki, Maitama…"/>
                </label>
                <label className="home-search-city" htmlFor="home-city">City
                  <select id="home-city" name="city" defaultValue=""><option value="">Any city</option>{cities.map(city=><option key={city.name} value={city.name}>{city.name}</option>)}</select>
                </label>
                <button className="hero-search-button" type="submit">Search homes <span aria-hidden="true">↗</span></button>
              </div>
              <p className="home-search-note"><span aria-hidden="true">⌖</span> Search properties across Ibadan, Lagos and Abuja</p>
            </form>
          </div>

          <div className="home-hero-visual">
            <Image
              className="home-hero-photo"
              src="/property-hero.jpg"
              alt="Contemporary architecture framed by mature trees at dusk"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
            />
            <div className="hero-image-wash" />
            <div className="hero-location-card">
              <span className="location-icon" aria-hidden="true">✳</span>
              <span><strong>Three cities. One place to begin.</strong><small>Ibadan · Lagos · Abuja</small></span>
              <span className="location-arrow" aria-hidden="true">↗</span>
            </div>
            <span className="hero-image-index" aria-hidden="true">01 / PROPERTY, WELL CONSIDERED</span>
          </div>
        </div>
        <div className="hero-bottomline"><span>Thoughtful search. A more confident next step.</span><span>Ibadan · Lagos · Abuja · Nigeria</span></div>
      </section>

      <section className="city-explorer" aria-labelledby="city-explorer-title">
        <div className="wrap">
          <div className="city-explorer-heading">
            <div><p className="eyebrow">Find your place</p><h2 id="city-explorer-title">Start with a city.</h2></div>
            <p>Choose where your next chapter could begin.</p>
          </div>
          <div className="city-grid">
            {cities.map(city=><Link className={`city-card city-card-${city.code}`} href={`/properties?city=${encodeURIComponent(city.name)}`} key={city.name}>
              <span className="city-card-index">{city.code} <span aria-hidden="true">/</span> {city.state}</span>
              <span className="city-card-name">{city.name}</span>
              <span className="city-card-cta">Explore properties <span aria-hidden="true">↗</span></span>
              <span className="city-card-mark" aria-hidden="true">{city.name.slice(0,1)}</span>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="wrap section home-collection">
        <div className="section-head">
          <div><p className="eyebrow">A considered collection</p><h2>Homes in the spotlight</h2></div>
          <Link href="/properties">Explore all properties <span aria-hidden="true">↗</span></Link>
        </div>
        {listings.length ? <div className="cards">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : (
          <div className="empty-state home-empty-state">
            <span className="empty-spark" aria-hidden="true">✳</span>
            <p className="eyebrow">A home search, made personal</p>
            <h2>Tell us what you have in mind.</h2>
            <p>Share your preferred city, area, budget and kind of home. The realtor can follow up about options that fit.</p>
            <Link className="button" href="/request">Make a property request <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </section>

      <section className="home-bottom-cta">
        <div className="wrap home-bottom-cta-inner">
          <div><p className="eyebrow">A more direct way to search</p><h2>Know what you’re looking for?</h2><p>Browse homes to rent or buy, or send a request if you need help narrowing things down.</p></div>
          <div className="home-bottom-actions"><Link className="button" href="/properties">Browse properties <span aria-hidden="true">↗</span></Link><Link href="/request">Tell us what you need <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
      <div className="wrap vehicle-footnote"><span>Also looking for a vehicle?</span><Link href="/cars">Browse vehicles for sale <span aria-hidden="true">↗</span></Link></div>
    </>
  );
}
