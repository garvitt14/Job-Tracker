
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const COLORS = {
  Applied: '#3b82f6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444'
}

export default function Analytics({ jobs }) {
  // Status breakdown data for pie chart
  const statusData = ['Applied', 'Interview', 'Offer', 'Rejected'].map(status => ({
    name: status,
    value: jobs.filter(j => j.status === status).length
  })).filter(d => d.value > 0)

  // Applications per week data for line chart
  const weeklyData = () => {
    const weeks = {}
    jobs.forEach(job => {
      const date = new Date(job.appliedDate)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      weeks[key] = (weeks[key] || 0) + 1
    })
    return Object.entries(weeks)
      .map(([week, count]) => ({ week, applications: count }))
      .slice(-8)
  }

  // Top companies applied to
  const companyData = () => {
    const companies = {}
    jobs.forEach(job => {
      companies[job.company] = (companies[job.company] || 0) + 1
    })
    return Object.entries(companies)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Key metrics
  const totalApps = jobs.length
  const interviews = jobs.filter(j => j.status === 'Interview').length
  const offers = jobs.filter(j => j.status === 'Offer').length
  const responseRate = totalApps > 0
    ? Math.round(((interviews + offers) / totalApps) * 100)
    : 0
  const avgScore = jobs.filter(j => j.resumeScore > 0).length > 0
    ? Math.round(jobs.filter(j => j.resumeScore > 0).reduce((a, b) => a + b.resumeScore, 0) / jobs.filter(j => j.resumeScore > 0).length)
    : 0

  if (jobs.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No data yet — add some job applications to see your analytics!</p>
      </div>
    )
  }

  return (
    <div className="analytics">
      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Applications</span>
          <span className="metric-value blue">{totalApps}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Interviews</span>
          <span className="metric-value yellow">{interviews}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Offers</span>
          <span className="metric-value green">{offers}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Response Rate</span>
          <span className="metric-value purple">{responseRate}%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Avg AI Score</span>
          <span className="metric-value teal">{avgScore > 0 ? `${avgScore}/100` : 'N/A'}</span>
        </div>
      </div>

      <div className="charts-grid">
        {/* Status Breakdown Pie Chart */}
        <div className="chart-card">
          <h3>Application Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Applications Line Chart */}
        <div className="chart-card">
          <h3>Applications Over Time</h3>
          {weeklyData().length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">Add more applications across different weeks to see the trend</p>
          )}
        </div>

        {/* Top Companies Bar Chart */}
        <div className="chart-card">
          <h3>Top Companies Applied</h3>
          {companyData().length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={companyData()} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="company" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">No company data yet</p>
          )}
        </div>

        {/* AI Score Distribution */}
        <div className="chart-card">
          <h3>AI Score Ranges</h3>
          {jobs.filter(j => j.resumeScore > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { range: '0-40', count: jobs.filter(j => j.resumeScore > 0 && j.resumeScore <= 40).length },
                { range: '41-60', count: jobs.filter(j => j.resumeScore > 40 && j.resumeScore <= 60).length },
                { range: '61-80', count: jobs.filter(j => j.resumeScore > 60 && j.resumeScore <= 80).length },
                { range: '81-100', count: jobs.filter(j => j.resumeScore > 80).length },
              ]}>
                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">Score some resumes with the AI scorer to see distribution</p>
          )}
        </div>
      </div>
    </div>
  )
}