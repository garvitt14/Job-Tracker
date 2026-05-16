import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API = 'http://localhost:4000/api'

function App() {
  const [jobs, setJobs] = useState([])
  const [view, setView] = useState('board')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showScorer, setShowScorer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)

  const [newJob, setNewJob] = useState({
    company: '',
    position: '',
    status: 'Applied',
    jobDescription: ''
  })

  const [scoreForm, setScoreForm] = useState({
    resume: '',
    jobDescription: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    const res = await axios.get(`${API}/jobs`)
    setJobs(res.data)
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
    if (!scoreForm.resume || !scoreForm.jobDescription) return
    setLoading(true)
    try {
      const res = await axios.post(`${API}/ai/score`, scoreForm)
      setScoreResult(res.data)
    } catch (err) {
      alert('AI scoring failed')
    }
    setLoading(false)
  }

  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected']

  const statusColors = {
    Applied: '#3b82f6',
    Interview: '#f59e0b',
    Offer: '#10b981',
    Rejected: '#ef4444'
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🎯 Job Tracker</h1>
        <div className="header-btns">
          <button className="btn-secondary" onClick={() => setShowScorer(!showScorer)}>
            ✨ AI Resume Scorer
          </button>
          <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            + Add Job
          </button>
        </div>
      </header>

      {/* Add Job Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Job</h2>
            <input
              placeholder="Company name *"
              value={newJob.company}
              onChange={e => setNewJob({ ...newJob, company: e.target.value })}
            />
            <input
              placeholder="Position *"
              value={newJob.position}
              onChange={e => setNewJob({ ...newJob, position: e.target.value })}
            />
            <select
              value={newJob.status}
              onChange={e => setNewJob({ ...newJob, status: e.target.value })}
            >
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <textarea
              placeholder="Job description (optional)"
              value={newJob.jobDescription}
              onChange={e => setNewJob({ ...newJob, jobDescription: e.target.value })}
              rows={4}
            />
            <div className="modal-btns">
              <button className="btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={addJob}>Add Job</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Scorer */}
      {showScorer && (
        <div className="scorer">
          <h2>✨ AI Resume Scorer</h2>
          <p>Paste your resume and job description to get an AI match score</p>
          <div className="scorer-grid">
            <textarea
              placeholder="Paste your resume here..."
              value={scoreForm.resume}
              onChange={e => setScoreForm({ ...scoreForm, resume: e.target.value })}
              rows={10}
            />
            <textarea
              placeholder="Paste job description here..."
              value={scoreForm.jobDescription}
              onChange={e => setScoreForm({ ...scoreForm, jobDescription: e.target.value })}
              rows={10}
            />
          </div>
          <button className="btn-primary" onClick={scoreResume} disabled={loading}>
            {loading ? 'Analyzing...' : '🔍 Analyze Match'}
          </button>

          {scoreResult && (
            <div className="score-result">
              <div className="score-header">
                <div className="score-circle" style={{
                  borderColor: scoreResult.score >= 70 ? '#10b981' : scoreResult.score >= 50 ? '#f59e0b' : '#ef4444'
                }}>
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

      {/* Kanban Board */}
      <div className="board">
        {statuses.map(status => (
          <div key={status} className="column">
            <div className="column-header" style={{ borderColor: statusColors[status] }}>
              <span>{status}</span>
              <span className="count">{jobs.filter(j => j.status === status).length}</span>
            </div>
            <div className="cards">
              {jobs
                .filter(j => j.status === status)
                .map(job => (
                  <div key={job._id} className="card">
                    <div className="card-top">
                      <h3>{job.position}</h3>
                      <button className="delete-btn" onClick={() => deleteJob(job._id)}>×</button>
                    </div>
                    <p className="company">{job.company}</p>
                    <p className="date">{new Date(job.appliedDate).toLocaleDateString()}</p>
                    <select
                      value={job.status}
                      onChange={e => updateStatus(job._id, e.target.value)}
                      style={{ borderColor: statusColors[job.status] }}
                    >
                      {statuses.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App