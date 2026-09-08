import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from './api'
import EmptyState from './components/EmptyState'
import Icon from './components/Icons'
import KanbanBoard from './components/KanbanBoard'
import { AnalyticsSkeleton, BoardSkeleton } from './components/Skeletons'
import { STATUSES } from './constants'
import './App.css'
import './ai.css'

const Analytics = lazy(() => import('./Analytics'))
const AIWorkspace = lazy(() => import('./features/AIWorkspace'))
const WeeklyDigest = lazy(() => import('./features/WeeklyDigest'))

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getErrorMessage = (error, fallback) => (
  error.response?.data?.message
  || error.response?.data?.errors?.[0]?.msg
  || fallback
)

const pageCopy = {
  board: {
    eyebrow: 'Application workspace',
    title: 'Your application pipeline',
    description: 'Drag each opportunity forward as your job search gains momentum.',
  },
  analytics: {
    eyebrow: 'Performance overview',
    title: 'Turn activity into insight',
    description: 'Understand your pipeline, response rate, and where to focus next.',
  },
  ai: {
    eyebrow: 'Agentic career studio',
    title: 'Build a stronger application with AI',
    description: 'Run a connected application pipeline or use a focused AI tool on its own.',
  },
  digest: {
    eyebrow: 'Weekly intelligence',
    title: 'Know what deserves attention next',
    description: 'Review momentum, uncover stale applications, and act on focused recommendations.',
  },
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -35, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 35, scale: 0.7 }}
          transition={{ duration: 0.18 }}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`toast toast-${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
        >
          <span className="toast-icon"><Icon name={toast.type === 'error' ? 'alert' : 'check'} size={16} /></span>
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const celebrationParticles = Array.from({ length: 18 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 18
  const distance = 78 + (index % 4) * 16
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][index % 4],
    rotate: 90 + index * 37,
  }
})

function OfferCelebration({ celebration }) {
  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="celebration"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {celebrationParticles.map((particle, index) => (
            <motion.span
              className="confetti-particle"
              style={{ background: particle.color }}
              key={index}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
              animate={{ x: particle.x, y: particle.y + 45, opacity: 0, scale: 1, rotate: particle.rotate }}
              transition={{ duration: 1.05, delay: index * 0.018, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            className="celebration-badge"
            initial={{ scale: 0, rotate: -12, y: 10 }}
            animate={{ scale: [0, 1.12, 1], rotate: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: 'backOut' }}
          >
            <Icon name="trophy" size={24} />
            <span>Offer!</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(getStoredUser)
  const [theme, setTheme] = useState(getInitialTheme)
  const [authView, setAuthView] = useState('login')
  const [view, setView] = useState('board')
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(Boolean(token))
  const [showAddForm, setShowAddForm] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [aiInitialTool, setAiInitialTool] = useState('pipeline')
  const [authError, setAuthError] = useState('')
  const [toast, setToast] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [newJob, setNewJob] = useState({ company: '', position: '', status: 'Applied', jobDescription: '', contactEmail: '' })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!celebration) return undefined
    const timeout = window.setTimeout(() => setCelebration(null), 1500)
    return () => window.clearTimeout(timeout)
  }, [celebration])

  const notify = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setJobs([])
  }, [])

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      const response = await api.get('/jobs')
      setJobs(response.data)
    } catch (error) {
      if (error.response?.status === 401) logout()
      else notify(getErrorMessage(error, 'Could not load your applications.'), 'error')
    } finally {
      setJobsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (!token) return undefined
    const timeout = window.setTimeout(fetchJobs, 0)
    return () => window.clearTimeout(timeout)
  }, [token, fetchJobs])

  const handleAuth = async (event) => {
    event?.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const endpoint = authView === 'login' ? '/auth/login' : '/auth/register'
      const payload = authView === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm
      const response = await api.post(endpoint, payload)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setToken(response.data.token)
      setUser(response.data.user)
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Something went wrong. Please try again.'))
    } finally {
      setAuthLoading(false)
    }
  }

  const addJob = async (event) => {
    event?.preventDefault()
    if (!newJob.company.trim() || !newJob.position.trim()) {
      notify('Company and position are required.', 'error')
      return
    }
    try {
      const response = await api.post('/jobs', newJob)
      setJobs((current) => [...current, response.data])
      setNewJob({ company: '', position: '', status: 'Applied', jobDescription: '', contactEmail: '' })
      setShowAddForm(false)
      setView('board')
      notify(`${response.data.position} added to your pipeline.`)
    } catch (error) {
      notify(getErrorMessage(error, 'Could not add this application.'), 'error')
    }
  }

  const updateStatus = async (id, status) => {
    const previousJob = jobs.find((job) => job._id === id)
    if (!previousJob || previousJob.status === status) return

    setJobs((current) => current.map((job) => (job._id === id ? { ...job, status } : job)))
    try {
      const response = await api.put(`/jobs/${id}`, { status })
      setJobs((current) => current.map((job) => (job._id === id ? response.data : job)))
      if (status === 'Offer') {
        setCelebration({ id: Date.now() })
        notify(`Amazing — congratulations on your ${previousJob.company} offer!`)
      } else {
        notify(`${previousJob.position} moved to ${status}.`)
      }
    } catch (error) {
      setJobs((current) => current.map((job) => (job._id === id ? previousJob : job)))
      notify(getErrorMessage(error, 'Status update failed. Your change was rolled back.'), 'error')
    }
  }

  const deleteJob = async (job) => {
    if (!window.confirm(`Delete ${job.position} at ${job.company}?`)) return
    const previousJobs = jobs
    setJobs((current) => current.filter((item) => item._id !== job._id))
    try {
      await api.delete(`/jobs/${job._id}`)
      notify('Application removed.')
    } catch (error) {
      setJobs(previousJobs)
      notify(getErrorMessage(error, 'Could not delete this application.'), 'error')
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
        <motion.div className="auth-showcase" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="auth-brand"><span className="brand-mark"><Icon name="target" size={23} /></span><span>Job Tracker</span></div>
          <div className="auth-copy">
            <span className="auth-kicker"><Icon name="sparkles" size={14} /> AI-powered career workspace</span>
            <h1>Turn every application into <em>momentum.</em></h1>
            <p>Organize your search, understand your progress, and tailor every application with intelligent tools.</p>
          </div>
          <div className="auth-preview" aria-hidden="true">
            <div className="preview-column">
              <span>Applied <b>3</b></span>
              <div className="preview-card"><i>PS</i><div><strong>Product Designer</strong><small>Pixel Studio</small></div></div>
              <div className="preview-card preview-card-muted"><i>NL</i><div><strong>Frontend Engineer</strong><small>North Labs</small></div></div>
            </div>
            <div className="preview-column preview-column-raised">
              <span>Interview <b>1</b></span>
              <div className="preview-card preview-card-accent"><i>AV</i><div><strong>AI Engineer</strong><small>Arc Ventures</small></div><Icon name="sparkles" size={15} /></div>
            </div>
          </div>
        </motion.div>

        <motion.form className="auth-card" onSubmit={handleAuth} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="mobile-auth-brand"><span className="brand-mark"><Icon name="target" size={21} /></span><span>Job Tracker</span></div>
          <div className="auth-heading">
            <h2>{authView === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{authView === 'login' ? 'Sign in to continue your job search.' : 'Start building your opportunity pipeline.'}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Authentication options">
            <button type="button" role="tab" aria-selected={authView === 'login'} className={authView === 'login' ? 'tab active' : 'tab'} onClick={() => { setAuthView('login'); setAuthError('') }}>Sign in</button>
            <button type="button" role="tab" aria-selected={authView === 'register'} className={authView === 'register' ? 'tab active' : 'tab'} onClick={() => { setAuthView('register'); setAuthError('') }}>Register</button>
          </div>
          <AnimatePresence initial={false}>
            {authView === 'register' && (
              <motion.label className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <span>Name</span>
                <input required placeholder="Your full name" autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
              </motion.label>
            )}
          </AnimatePresence>
          <label className="field">
            <span>Email</span>
            <input required placeholder="you@example.com" type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input required minLength="6" placeholder="At least 6 characters" type="password" autoComplete={authView === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
          </label>
          {authError && <motion.p className="auth-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Icon name="alert" size={15} />{authError}</motion.p>}
          <button className="btn-primary auth-btn" type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait…' : authView === 'login' ? 'Sign in to workspace' : 'Create my account'}
            {!authLoading && <Icon name="arrowRight" size={17} />}
          </button>
          <p className="auth-footnote">Secure authentication · Your data stays private</p>
        </motion.form>
      </div>
    )
  }

  const copy = pageCopy[view]
  const interviews = jobs.filter((job) => job.status === 'Interview').length
  const offers = jobs.filter((job) => job.status === 'Offer').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setView('board')}>
            <span className="brand-mark"><Icon name="target" size={21} /></span>
            <span className="brand-name">Job Tracker</span>
          </button>

          <nav className="main-nav" aria-label="Main navigation">
            {[
              { id: 'board', label: 'Board', icon: 'board' },
              { id: 'analytics', label: 'Analytics', icon: 'chart' },
              { id: 'ai', label: 'AI Studio', icon: 'sparkles' },
              { id: 'digest', label: 'Digest', icon: 'bolt' },
            ].map((item) => (
              <button className={view === item.id ? 'nav-item active' : 'nav-item'} type="button" onClick={() => { if (item.id === 'ai') setAiInitialTool('pipeline'); setView(item.id) }} key={item.id}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {view === item.id && <motion.span className="nav-indicator" layoutId="nav-indicator" />}
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            <ThemeToggle theme={theme} onToggle={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
            <button className="btn-primary add-job-header" type="button" onClick={() => setShowAddForm(true)}><Icon name="plus" size={17} />Add application</button>
            <div className="user-profile">
              <span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="user-name">{user?.name}</span>
              <button className="icon-button logout-button" type="button" onClick={logout} aria-label="Log out" title="Log out"><Icon name="logout" size={17} /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-content">
        <section className="page-header">
          <div>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          {(view === 'board' || view === 'analytics') && (
            <div className="quick-stats" aria-label="Pipeline summary">
              <div><span>Total</span><strong>{jobsLoading ? '—' : jobs.length}</strong></div>
              <div><span>Interviews</span><strong className="stat-interview">{jobsLoading ? '—' : interviews}</strong></div>
              <div><span>Offers</span><strong className="stat-offer">{jobsLoading ? '—' : offers}</strong></div>
            </div>
          )}
        </section>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            className="view-content"
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            {view === 'board' && (
              jobsLoading
                ? <BoardSkeleton />
                : jobs.length === 0
                  ? <EmptyState onAction={() => setShowAddForm(true)} />
                  : <KanbanBoard jobs={jobs} onDelete={deleteJob} onStatusChange={updateStatus} />
            )}
            {view === 'analytics' && (
              jobsLoading
                ? <AnalyticsSkeleton />
                : <Suspense fallback={<AnalyticsSkeleton />}><Analytics jobs={jobs} onAdd={() => setShowAddForm(true)} /></Suspense>
            )}
            {view === 'ai' && (
              <Suspense fallback={<BoardSkeleton />}>
                <AIWorkspace
                  jobs={jobs}
                  notify={notify}
                  initialTool={aiInitialTool}
                  onJobPatched={(id, patch) => setJobs((current) => current.map((job) => job._id === id ? { ...job, ...patch } : job))}
                  onJobUpdated={(updatedJob) => setJobs((current) => current.map((job) => job._id === updatedJob._id ? updatedJob : job))}
                />
              </Suspense>
            )}
            {view === 'digest' && (
              jobsLoading
                ? <AnalyticsSkeleton />
                : <Suspense fallback={<AnalyticsSkeleton />}>
                    <WeeklyDigest
                      jobs={jobs}
                      notify={notify}
                      onAdd={() => setShowAddForm(true)}
                      onOpenAI={() => { setAiInitialTool('followup'); setView('ai') }}
                    />
                  </Suspense>
            )}
          </motion.main>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowAddForm(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form className="modal" onSubmit={addJob} role="dialog" aria-modal="true" aria-labelledby="add-job-title" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
              <div className="modal-header"><div><span className="eyebrow">New opportunity</span><h2 id="add-job-title">Add an application</h2></div><button className="icon-button" type="button" onClick={() => setShowAddForm(false)} aria-label="Close dialog"><Icon name="close" size={18} /></button></div>
              <div className="modal-grid">
                <label className="field"><span>Company <b>*</b></span><input autoFocus required placeholder="e.g. Acme Inc." value={newJob.company} onChange={(event) => setNewJob({ ...newJob, company: event.target.value })} /></label>
                <label className="field"><span>Position <b>*</b></span><input required placeholder="e.g. Product Engineer" value={newJob.position} onChange={(event) => setNewJob({ ...newJob, position: event.target.value })} /></label>
              </div>
              <div className="modal-grid">
                <label className="field"><span>Pipeline stage</span><select value={newJob.status} onChange={(event) => setNewJob({ ...newJob, status: event.target.value })}>{STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
                <label className="field"><span>Contact email <i>Optional</i></span><input type="email" placeholder="recruiter@company.com" value={newJob.contactEmail} onChange={(event) => setNewJob({ ...newJob, contactEmail: event.target.value })} /></label>
              </div>
              <label className="field"><span>Job description <i>Optional</i></span><textarea placeholder="Paste the job description to unlock AI tools later…" value={newJob.jobDescription} onChange={(event) => setNewJob({ ...newJob, jobDescription: event.target.value })} rows="6" /></label>
              <div className="modal-btns"><button className="btn-secondary" type="button" onClick={() => setShowAddForm(false)}>Cancel</button><button className="btn-primary" type="submit"><Icon name="plus" size={17} />Add to pipeline</button></div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} />
      <OfferCelebration celebration={celebration} />
    </div>
  )
}

export default App
