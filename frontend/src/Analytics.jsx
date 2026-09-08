import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import EmptyState from './components/EmptyState'
import { STATUS_META, STATUSES } from './constants'

const chartMotion = {
  hidden: { opacity: 0, y: 14 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.07, duration: 0.36, ease: 'easeOut' },
  }),
}

const tooltipStyle = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  boxShadow: 'var(--shadow-md)',
  color: 'var(--text-primary)',
  fontSize: '12px',
}

export default function Analytics({ jobs, onAdd }) {
  const statusData = STATUSES.map((status) => ({
    name: status,
    value: jobs.filter((job) => job.status === status).length,
  })).filter((item) => item.value > 0)

  const weeklyData = (() => {
    const weeks = {}
    jobs.forEach((job) => {
      const date = new Date(job.appliedDate)
      if (Number.isNaN(date.getTime())) return
      const weekStart = new Date(date)
      weekStart.setHours(0, 0, 0, 0)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = weekStart.toISOString().slice(0, 10)
      weeks[key] = (weeks[key] || 0) + 1
    })
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, applications]) => ({
        week: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications,
      }))
  })()

  const companyData = (() => {
    const companies = {}
    jobs.forEach((job) => {
      companies[job.company] = (companies[job.company] || 0) + 1
    })
    return Object.entries(companies)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  })()

  const totalApps = jobs.length
  const interviews = jobs.filter((job) => job.status === 'Interview').length
  const offers = jobs.filter((job) => job.status === 'Offer').length
  const responseRate = totalApps > 0 ? Math.round(((interviews + offers) / totalApps) * 100) : 0
  const scoredJobs = jobs.filter((job) => job.resumeScore > 0)
  const avgScore = scoredJobs.length
    ? Math.round(scoredJobs.reduce((sum, job) => sum + job.resumeScore, 0) / scoredJobs.length)
    : 0

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="chart"
        title="Your insights will appear here"
        description="Add your first application to unlock pipeline trends, response rates, and AI match insights."
        onAction={onAdd}
      />
    )
  }

  const metrics = [
    { label: 'Total applications', value: totalApps, tone: 'blue' },
    { label: 'Interviews', value: interviews, tone: 'yellow' },
    { label: 'Offers', value: offers, tone: 'green' },
    { label: 'Response rate', value: `${responseRate}%`, tone: 'purple' },
    { label: 'Avg AI score', value: avgScore > 0 ? `${avgScore}/100` : 'N/A', tone: 'teal' },
  ]

  return (
    <div className="analytics">
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <motion.div
            className="metric-card"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={chartMotion}
            key={metric.label}
          >
            <span className="metric-label">{metric.label}</span>
            <span className={`metric-value ${metric.tone}`}>{metric.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="charts-grid">
        <motion.section className="chart-card" custom={0} initial="hidden" animate="visible" variants={chartMotion}>
          <div className="chart-heading">
            <div><span className="eyebrow">Pipeline</span><h3>Application status</h3></div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="47%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
                animationBegin={80}
                animationDuration={850}
                animationEasing="ease-out"
              >
                {statusData.map((entry) => <Cell key={entry.name} fill={STATUS_META[entry.name].color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={(value) => <span className="chart-legend-label">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section className="chart-card" custom={1} initial="hidden" animate="visible" variants={chartMotion}>
          <div className="chart-heading"><div><span className="eyebrow">Momentum</span><h3>Applications over time</h3></div></div>
          {weeklyData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData} margin={{ top: 12, right: 14, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 5" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', stroke: 'var(--surface)', strokeWidth: 3, r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="chart-empty">Add applications across different weeks to see your momentum.</p>}
        </motion.section>

        <motion.section className="chart-card" custom={2} initial="hidden" animate="visible" variants={chartMotion}>
          <div className="chart-heading"><div><span className="eyebrow">Focus</span><h3>Top companies</h3></div></div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={companyData} layout="vertical" margin={{ top: 6, right: 18, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="company" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={82} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 5, 5, 0]} isAnimationActive animationDuration={850} />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section className="chart-card" custom={3} initial="hidden" animate="visible" variants={chartMotion}>
          <div className="chart-heading"><div><span className="eyebrow">AI insights</span><h3>Match score ranges</h3></div></div>
          {scoredJobs.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { range: '0–40', count: jobs.filter((job) => job.resumeScore > 0 && job.resumeScore <= 40).length },
                { range: '41–60', count: jobs.filter((job) => job.resumeScore > 40 && job.resumeScore <= 60).length },
                { range: '61–80', count: jobs.filter((job) => job.resumeScore > 60 && job.resumeScore <= 80).length },
                { range: '81–100', count: jobs.filter((job) => job.resumeScore > 80).length },
              ]} margin={{ top: 12, right: 14, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 5" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[5, 5, 0, 0]} isAnimationActive animationDuration={850} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="chart-empty">Score a resume with AI to see your match distribution.</p>}
        </motion.section>
      </div>
    </div>
  )
}
