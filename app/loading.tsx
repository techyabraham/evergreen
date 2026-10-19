export default function Loading() {
  return (
    <section className="wrap route-loading" aria-label="Page content loading" aria-busy="true">
      <span className="visually-hidden" role="status">Loading page content.</span>
      <div className="skeleton-line skeleton-eyebrow" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-copy" />
      <div className="route-loading-cards" aria-hidden="true">
        {[0, 1, 2].map(index => <div className="listing-skeleton" key={index}>
          <div className="skeleton-photo" />
          <div className="listing-skeleton-copy"><span className="skeleton-line" /><span className="skeleton-line short" /></div>
        </div>)}
      </div>
    </section>
  );
}
