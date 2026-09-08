export function BoardSkeleton() {
  return (
    <div className="kanban-board skeleton-board" aria-label="Loading applications" aria-busy="true">
      {Array.from({ length: 5 }, (_, columnIndex) => (
        <div className="kanban-column skeleton-column" key={columnIndex}>
          <div className="skeleton skeleton-heading" />
          {Array.from({ length: columnIndex % 2 === 0 ? 3 : 2 }, (_, cardIndex) => (
            <div className="skeleton-card" key={cardIndex}>
              <div className="skeleton skeleton-line skeleton-line-title" />
              <div className="skeleton skeleton-line skeleton-line-short" />
              <div className="skeleton skeleton-line skeleton-line-meta" />
              <div className="skeleton skeleton-pill" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="analytics" aria-label="Loading analytics" aria-busy="true">
      <div className="metrics-grid">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="metric-card" key={index}>
            <div className="skeleton skeleton-line skeleton-line-short" />
            <div className="skeleton skeleton-metric" />
          </div>
        ))}
      </div>
      <div className="charts-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="chart-card" key={index}>
            <div className="skeleton skeleton-line skeleton-chart-title" />
            <div className="skeleton-chart-bars">
              {[48, 72, 42, 84, 62, 90].map((height, barIndex) => (
                <div className="skeleton skeleton-bar" style={{ height: `${height}%` }} key={barIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ScoreSkeleton() {
  return (
    <div className="score-result score-skeleton" aria-label="Analyzing resume" aria-busy="true">
      <div className="skeleton skeleton-score-circle" />
      <div className="score-skeleton-copy">
        <div className="skeleton skeleton-line skeleton-line-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-short" />
      </div>
    </div>
  )
}
