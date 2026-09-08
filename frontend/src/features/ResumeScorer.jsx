import { motion } from 'framer-motion'
import { useState } from 'react'
import api from '../api'
import Icon from '../components/Icons'
import ResumeUpload from '../components/ResumeUpload'
import { ScoreSkeleton } from '../components/Skeletons'

const errorMessage = (error) => error.response?.data?.message || 'AI scoring failed. Please try again.'

export default function ResumeScorer({ jobs, notify, onJobPatched }) {
  const [resumeFile, setResumeFile] = useState(null)
  const [jobId, setJobId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectJob = (id) => {
    setJobId(id)
    const job = jobs.find((item) => item._id === id)
    if (job) setJobDescription(job.jobDescription || '')
    setResult(null)
  }

  const scoreResume = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      notify('Add a resume and job description before analyzing.', 'error')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('resumeFile', resumeFile)
      formData.append('jobDescription', jobDescription)
      if (jobId) formData.append('jobId', jobId)
      const response = await api.post('/ai/score-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(response.data)
      if (jobId) onJobPatched(jobId, { resumeScore: response.data.score, feedback: response.data.feedback })
    } catch (error) {
      notify(errorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ai-panel">
      <div className="tool-heading">
        <span className="tool-heading-icon"><Icon name="search" size={21} /></span>
        <div><h2>JD-to-resume match</h2><p>Get an ATS-style score plus concrete, truthful improvements tailored to the role.</p></div>
      </div>

      <label className="field ai-job-select">
        <span>Use a tracked application <i>Optional</i></span>
        <select value={jobId} onChange={(event) => selectJob(event.target.value)}>
          <option value="">Paste a new job description</option>
          {jobs.map((job) => <option value={job._id} key={job._id}>{job.position} · {job.company}</option>)}
        </select>
      </label>

      <div className="scorer-grid">
        <div className="scorer-field-group">
          <span className="input-label">Your resume</span>
          <ResumeUpload file={resumeFile} onChange={setResumeFile} id="match-resume" onError={(message) => notify(message, 'error')} />
        </div>
        <label className="scorer-field-group">
          <span className="input-label">Job description</span>
          <textarea placeholder="Paste the complete job description here…" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows="11" />
          <span className="character-count">{jobDescription.length.toLocaleString()} characters</span>
        </label>
      </div>
      <div className="scorer-action">
        <button className="btn-primary" type="button" onClick={scoreResume} disabled={loading || !resumeFile || !jobDescription.trim()}>
          <Icon name="search" size={17} />{loading ? 'Analyzing your match…' : 'Analyze match'}
        </button>
        <span><Icon name="sparkles" size={13} /> Powered by Groq AI</span>
      </div>

      {loading && <ScoreSkeleton />}
      {result && !loading && (
        <motion.div className="score-result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="score-header">
            <div className={`score-circle score-${result.score >= 70 ? 'high' : result.score >= 50 ? 'medium' : 'low'}`}>
              <span className="score-num">{result.score}</span><span className="score-label">/ 100</span>
            </div>
            <div><span className="eyebrow">Match result</span><h3>{result.verdict}</h3><p>{result.feedback}</p></div>
          </div>
          <div className="keywords-grid">
            <div className="keywords-box matched"><h4><Icon name="check" size={15} /> Matched keywords</h4><div>{(result.matchedKeywords || []).map((keyword) => <span key={keyword} className="keyword">{keyword}</span>)}</div></div>
            <div className="keywords-box missing"><h4><Icon name="alert" size={15} /> Missing opportunities</h4><div>{(result.missingKeywords || []).map((keyword) => <span key={keyword} className="keyword">{keyword}</span>)}</div></div>
          </div>
          {result.suggestions?.length > 0 && (
            <div className="actionable-suggestions">
              <div className="suggestions-heading"><div><span className="eyebrow">Action plan</span><h3>Specific ways to strengthen your resume</h3></div><span>{result.suggestions.length} recommendations</span></div>
              <div className="suggestion-list">
                {result.suggestions.map((suggestion, index) => (
                  <div className="suggestion-item" key={`${suggestion.skill}-${index}`}>
                    <span className={`priority-dot priority-${suggestion.priority}`} />
                    <div><strong>{suggestion.skill}</strong><p>{suggestion.suggestion}</p></div>
                    <span className={`priority-label priority-${suggestion.priority}`}>{suggestion.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  )
}
