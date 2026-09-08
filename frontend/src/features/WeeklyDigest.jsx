import { motion } from 'framer-motion'
import { useState } from 'react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icons'
import { STATUS_META } from '../constants'

export default function WeeklyDigest({ jobs, notify, onAdd, onOpenAI }) {
  const [digest, setDigest] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const response = await api.get('/ai/digest')
      setDigest(response.data)
    } catch (error) {
      notify(error.response?.data?.message || 'Could not generate your weekly digest.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (jobs.length === 0) {
    return <EmptyState icon="chart" title="No activity to summarize yet" description="Add your first application, then return for an AI-guided weekly review." onAction={onAdd} />
  }

  if (!digest && !loading) {
    return (
      <motion.section className="digest-intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="digest-illustration" aria-hidden="true"><span><Icon name="sparkles" size={27} /></span><i /><i /><i /></div>
        <span className="agent-badge"><Icon name="bolt" size={13} /> On-demand AI review</span>
        <h2>Make your next move with context.</h2>
        <p>The digest reviews this week’s activity, finds applications with no movement for seven days, and suggests a practical next action for each.</p>
        <button className="btn-primary" type="button" onClick={generate}><Icon name="sparkles" size={16} />Generate this week’s digest</button>
        <small>No background scheduler required · Fresh analysis whenever you ask</small>
      </motion.section>
    )
  }

  if (loading) {
    return (
      <div className="digest-loading" aria-label="Generating weekly digest" aria-busy="true">
        <div className="digest-loading-hero"><div className="skeleton skeleton-line skeleton-line-short" /><div className="skeleton skeleton-line skeleton-line-title" /><div className="skeleton skeleton-line" /></div>
        <div className="digest-loading-grid">{Array.from({ length: 5 }, (_, index) => <div className="metric-card" key={index}><div className="skeleton skeleton-line skeleton-line-short" /><div className="skeleton skeleton-metric" /></div>)}</div>
        <div className="skeleton digest-loading-panel" />
      </div>
    )
  }

  return (
    <motion.div className="weekly-digest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <section className="digest-summary-card">
        <div className="digest-summary-top"><span className="digest-ai-icon"><Icon name="sparkles" size={22} /></span><div><span className="eyebrow">AI coach summary</span><h2>Your week in review</h2></div><button className="btn-secondary" type="button" onClick={generate}><Icon name="refresh" size={14} />Refresh</button></div>
        <p>{digest.summary}</p>
        <span className="digest-timestamp">Generated {new Date(digest.generatedAt).toLocaleString()}</span>
      </section>

      <div className="digest-metrics">
        <div className="digest-primary-metric"><span>New this week</span><strong>{digest.applicationsThisWeek}</strong><small>of {digest.totalApplications} total applications</small></div>
        <div className="digest-status-grid">
          {digest.statusBreakdown.map((item) => <div key={item.status}><span className="status-dot" style={{ background: STATUS_META[item.status]?.color }} /><p>{item.status}</p><strong>{item.count}</strong></div>)}
        </div>
      </div>

      <div className="digest-columns">
        <section className="digest-section">
          <div className="digest-section-heading"><div><span className="eyebrow">Positive signals</span><h3>Wins this week</h3></div><span className="digest-count">{digest.wins.length}</span></div>
          {digest.wins.length ? <ul className="wins-list">{digest.wins.map((win, index) => <li key={win}><span><Icon name="check" size={14} /></span><p>{win}</p><b>{String(index + 1).padStart(2, '0')}</b></li>)}</ul> : <p className="digest-section-empty">Keep taking consistent action—your next win will show here.</p>}
        </section>

        <section className="digest-section digest-stale-section">
          <div className="digest-section-heading"><div><span className="eyebrow">Needs attention</span><h3>Stale applications</h3></div><span className="digest-count">{digest.staleApplications.length}</span></div>
          {digest.staleApplications.length ? (
            <div className="stale-list">
              {digest.staleApplications.map((job) => (
                <article className="stale-item" key={job.jobId}>
                  <div className="stale-job"><span className="company-mark">{job.company.charAt(0).toUpperCase()}</span><div><strong>{job.position}</strong><p>{job.company} · {job.status}</p></div><b><Icon name="clock" size={12} />{job.daysStale} days</b></div>
                  <div className="stale-action"><span><Icon name="arrowRight" size={14} /></span><div><strong>Suggested next action</strong><p>{job.suggestedAction}</p>{job.reason && <small>{job.reason}</small>}</div></div>
                </article>
              ))}
              <button className="btn-secondary digest-followup-cta" type="button" onClick={onOpenAI}><Icon name="mail" size={15} />Open follow-up assistant</button>
            </div>
          ) : <div className="all-current"><span><Icon name="check" size={18} /></span><div><strong>Everything is current</strong><p>No active application has been waiting seven days without movement.</p></div></div>}
        </section>
      </div>
    </motion.div>
  )
}
