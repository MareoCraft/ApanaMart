function RouteDataLoadingSkeleton({ mode = 'customer' }) {
  return (
    <div
      className={`route-loading-overlay ${mode === 'admin' ? 'admin' : ''}`}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="route-loading-shell">
        <div className="skeleton shimmer route-loading-pill" />
        <div className="skeleton shimmer route-loading-line" />
        <div className="skeleton shimmer route-loading-line short" />
        <div className="route-loading-grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton shimmer route-loading-block" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RouteDataLoadingSkeleton
