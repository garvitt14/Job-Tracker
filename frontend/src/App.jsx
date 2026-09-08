import Analytics from './Analytics'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [authView, setAuthView] = useState('login')
  const [view, setView] = useState('board')
  const [jobs, setJobs] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showScorer, setShowScorer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [newJob, setNewJob] = useState({ company: '', position: '', status: 'Applied', jobDescription: '' })
  const [scoreForm, setScoreForm] = useState({ resume: '', jobDescription: '' })
  const [resumeFile, setResumeFile] = useState(null) // holds the actual File object selected by the user

  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected']
  const statusColors = { Applied: '#3b82f6', Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444' }

  useEffect(() => {
    axios.interceptors.request.use(config => {
      const t = localStorage.getItem('token')
      if (t) config.headers.Authorization = `Bearer ${t}`
      return config
    })
  }, [])

  useEffect(() => {
    if (token) fetchJobs()
  }, [token])

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/jobs`)
      setJobs(res.data)
    } catch (err) {
      if (err.response?.status === 401) logout()
    }
  }

  const handleAuth = async () => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const endpoint = authView === 'login' ? '/auth/login' : '/auth/register'
      const payload = authView === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password }
      const res = await axios.post(`${API}${endpoint}`, payload)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      setUser(res.data.user)
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Something went wrong')
    }
    setAuthLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setJobs([])
  }

  const addJob = async () => {
    if (!newJob.company || !newJob.position) return
    await axios.post(`${API}/jobs`, newJob)
    setNewJob({ company: '', position: '', status: 'Applied', jobDescription: '' })
    setShowAddForm(false)
    fetchJobs()
  }

  const updateStatus = async (id, status) => {
    await axios.put(`${API}/jobs/${id}`, { status })
    fetchJobs()
  }

  const deleteJob = async (id) => {
    await axios.delete(`${API}/jobs/${id}`)
    fetchJobs()
  }

  const scoreResume = async () => {
    if (!resumeFile || !scoreForm.jobDescription) return
    setLoading(true)
    try {
      // FormData lets us send a real file (binary data) plus text fields
      // in one request - JSON can only carry text/numbers, not files.
      // The key 'resumeFile' here MUST match upload.single('resumeFile')
      // on the backend route, or multer won't find the file.
      const formData = new FormData()
      formData.append('resumeFile', resumeFile)
      formData.append('jobDescription', scoreForm.jobDescription)

      const res = await axios.post(`${API}/ai/score-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setScoreResult(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'AI scoring failed')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">🎯</div>
          <h1>Job Tracker</h1>
          <p className="auth-tagline">Track applications. Score your resume with AI.</p>
          <div className="auth-tabs">
            <button className={authView === 'login' ? 'tab active' : 'tab'} onClick={() => { setAuthView('login'); setAuthError('') }}>Login</button>
            <button className={authView === 'register' ? 'tab active' : 'tab'} onClick={() => { setAuthView('register'); setAuthError('') }}>Register</button>
          </div>
          {authView === 'register' && (
            <input placeholder="Your name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />
          )}
          <input placeholder="Email address" type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
          <input placeholder="Password (min 6 characters)" type="password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAuth()} />
          {authError && <p className="auth-error">{authError}</p>}
          <button className="btn-primary auth-btn" onClick={handleAuth} disabled={authLoading}>
            {authLoading ? 'Please wait...' : authView === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎯 Job Tracker</h1>
        <div className="header-btns">
          <span className="user-badge">👋 {user?.name}</span>
          <button className={view === 'board' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('board')}>Board</button>
          <button className={view === 'analytics' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('analytics')}>Analytics</button>
          <button className="btn-secondary" onClick={() => setShowScorer(!showScorer)}>✨ AI Scorer</button>
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>+ Add Job</button>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Job</h2>
            <input placeholder="Company name *" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} />
            <input placeholder="Position *" value={newJob.position} onChange={e => setNewJob({ ...newJob, position: e.target.value })} />
            <select value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value })}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <textarea placeholder="Job description (optional)" value={newJob.jobDescription} onChange={e => setNewJob({ ...newJob, jobDescription: e.target.value })} rows={4} />
            <div className="modal-btns">
              <button className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={addJob}>Add Job</button>
            </div>
          </div>
        </div>
      )}

      {showScorer && (
        <div className="scorer">
          <h2>✨ AI Resume Scorer</h2>
          <p>Paste your resume and job description to get an AI match score</p>
          <div className="scorer-grid">
            <div className="resume-upload">
              <input
                type="file"
                id="resumeFile"
                accept=".pdf,.docx"
                onChange={e => setResumeFile(e.target.files[0] || null)}
                style={{ display: 'none' }}
              />
              <label htmlFor="resumeFile" className="resume-upload-label">
                {resumeFile ? (
                  <>📄 {resumeFile.name} <span className="resume-upload-change">(click to change)</span></>
                ) : (
                  <>📤 Click to upload your resume <span className="resume-upload-hint">PDF or DOCX, max 5MB</span></>
                )}
              </label>
            </div>
            <textarea placeholder="Paste job description here..." value={scoreForm.jobDescription} onChange={e => setScoreForm({ ...scoreForm, jobDescription: e.target.value })} rows={10} />
          </div>
          <button className="btn-primary" onClick={scoreResume} disabled={loading || !resumeFile}>
            {loading ? 'Analyzing...' : '🔍 Analyze Match'}
          </button>
          {scoreResult && (
            <div className="score-result">
              <div className="score-header">
                <div className="score-circle" style={{ borderColor: scoreResult.score >= 70 ? '#10b981' : scoreResult.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                  <span className="score-num">{scoreResult.score}</span>
                  <span className="score-label">/ 100</span>
                </div>
                <div>
                  <h3>{scoreResult.verdict}</h3>
                  <p>{scoreResult.feedback}</p>
                </div>
              </div>
              <div className="keywords-grid">
                <div className="keywords-box matched">
                  <h4>✅ Matched Keywords</h4>
                  {scoreResult.matchedKeywords.map(k => <span key={k} className="keyword">{k}</span>)}
                </div>
                <div className="keywords-box missing">
                  <h4>❌ Missing Keywords</h4>
                  {scoreResult.missingKeywords.map(k => <span key={k} className="keyword">{k}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'analytics' ? (
        <Analytics jobs={jobs} />
      ) : (
        <div className="board">
          {statuses.map(status => (
            <div key={status} className="column">
              <div className="column-header" style={{ borderColor: statusColors[status] }}>
                <span>{status}</span>
                <span className="count">{jobs.filter(j => j.status === status).length}</span>
              </div>
              <div className="cards">
                {jobs.filter(j => j.status === status).map(job => (
                  <div key={job._id} className="card">
                    <div className="card-top">
                      <h3>{job.position}</h3>
                      <button className="delete-btn" onClick={() => deleteJob(job._id)}>×</button>
                    </div>
                    <p className="company">{job.company}</p>
                    <p className="date">{new Date(job.appliedDate).toLocaleDateString()}</p>
                    <select value={job.status} onChange={e => updateStatus(job._id, e.target.value)} style={{ borderColor: statusColors[job.status] }}>
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App