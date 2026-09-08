import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import api from '../api'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icons'
import ResumeUpload from '../components/ResumeUpload'
import ResumeScorer from './ResumeScorer'

const getError = (error, fallback = 'The AI request failed. Please try again.') => error.response?.data?.message || fallback
const daysSince = (value) => value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)) : 0

const initialSteps = [
  { id: 'score', number: '01', title: 'Analyze resume match', description: 'Find strengths, gaps, and priority skills.', icon: 'search', status: 'pending' },
  { id: 'cover', number: '02', title: 'Create cover letter', description: 'Use match insights to tailor the narrative.', icon: 'document', status: 'pending' },
  { id: 'questions', number: '03', title: 'Predict interview questions', description: 'Prepare for technical and behavioral themes.', icon: 'questions', status: 'pending' },
  { id: 'followup', number: '04', title: 'Draft future follow-up', description: 'Prepare a respectful message for the right time.', icon: 'mail', status: 'pending' },
]

function JobContextFields({ jobs, context, setContext, includeResume, resumeFile, setResumeFile, notify, resumeId }) {
  const selectJob = (jobId) => {
    const job = jobs.find((item) => item._id === jobId)
    setContext(job ? {
      jobId,
      company: job.company,
      position: job.position,
      jobDescription: job.jobDescription || '',
    } : { jobId: '', company: '', position: '', jobDescription: '' })
  }

  return (
    <div className="ai-context-form">
      <label className="field ai-job-select ai-context-wide">
        <span>Start from a tracked application <i>Optional</i></span>
        <select value={context.jobId} onChange={(event) => selectJob(event.target.value)}>
          <option value="">Use a new job description</option>
          {jobs.map((job) => <option value={job._id} key={job._id}>{job.position} · {job.company}</option>)}
        </select>
      </label>
      <label className="field"><span>Company</span><input placeholder="Company name" value={context.company} onChange={(event) => setContext({ ...context, company: event.target.value })} /></label>
      <label className="field"><span>Position</span><input placeholder="Role title" value={context.position} onChange={(event) => setContext({ ...context, position: event.target.value })} /></label>
      {includeResume && (
        <div className="scorer-field-group ai-context-resume">
          <span className="input-label">Resume</span>
          <ResumeUpload compact file={resumeFile} onChange={setResumeFile} id={resumeId} onError={(message) => notify(message, 'error')} />
        </div>
      )}
      <label className={`scorer-field-group ai-context-jd ${includeResume ? '' : 'ai-context-wide'}`}>
        <span className="input-label">Job description</span>
        <textarea placeholder="Paste the job description…" value={context.jobDescription} onChange={(event) => setContext({ ...context, jobDescription: event.target.value })} rows="8" />
        <span className="character-count">{context.jobDescription.length.toLocaleString()} characters</span>
      </label>
    </div>
  )
}

function PipelineOutput({ step, output, onOutputChange }) {
  if (step.status === 'running') {
    return <div className="agent-running" aria-live="polite"><span>Agent is working</span><div className="agent-running-lines"><i /><i /><i /></div></div>
  }
  if (step.status === 'error') return <div className="agent-step-error"><Icon name="alert" size={15} />{step.error}</div>
  if (step.status !== 'complete' || !output) return null

  if (step.id === 'score') {
    return (
      <div className="pipeline-score-output">
        <span className={`pipeline-score score-${output.score >= 70 ? 'high' : output.score >= 50 ? 'medium' : 'low'}`}>{output.score}<small>/100</small></span>
        <div><strong>{output.verdict}</strong><p>{output.feedback}</p><div className="mini-keywords">{output.matchedKeywords?.slice(0, 6).map((keyword) => <span key={keyword}>{keyword}</span>)}</div></div>
      </div>
    )
  }
  if (step.id === 'cover') {
    return <textarea className="agent-output-editor" aria-label="Generated cover letter" value={output.coverLetter} onChange={(event) => onOutputChange({ ...output, coverLetter: event.target.value })} rows="12" />
  }
  if (step.id === 'questions') {
    return (
      <div className="pipeline-question-groups">
        {output.categories?.map((group) => <div key={group.category}><strong>{group.category}</strong><ol>{group.questions?.map((question) => <li key={question}>{question}</li>)}</ol></div>)}
      </div>
    )
  }
  return (
    <div className="pipeline-follow-output">
      <input aria-label="Follow-up email subject" value={output.subject} onChange={(event) => onOutputChange({ ...output, subject: event.target.value })} />
      <textarea aria-label="Follow-up email body" value={output.body} onChange={(event) => onOutputChange({ ...output, body: event.target.value })} rows="8" />
    </div>
  )
}

function AgentPipeline({ jobs, notify, onJobPatched }) {
  const [context, setContext] = useState({ jobId: '', company: '', position: '', jobDescription: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [steps, setSteps] = useState(initialSteps)
  const [outputs, setOutputs] = useState({})
  const [running, setRunning] = useState(false)

  const updateStep = (id, patch) => setSteps((current) => current.map((step) => step.id === id ? { ...step, ...patch } : step))

  const executeStep = async (id, request) => {
    updateStep(id, { status: 'running', error: '' })
    try {
      const output = await request()
      setOutputs((current) => ({ ...current, [id]: output }))
      updateStep(id, { status: 'complete' })
      return output
    } catch (error) {
      const message = getError(error)
      updateStep(id, { status: 'error', error: message })
      throw error
    }
  }

  const runPipeline = async () => {
    if (!resumeFile || !context.jobDescription.trim()) {
      notify('Add a resume and job description to start the agent.', 'error')
      return
    }
    setRunning(true)
    setSteps(initialSteps)
    setOutputs({})
    try {
      const score = await executeStep('score', async () => {
        const formData = new FormData()
        formData.append('resumeFile', resumeFile)
        formData.append('jobDescription', context.jobDescription)
        if (context.jobId) formData.append('jobId', context.jobId)
        const response = await api.post('/ai/score-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (context.jobId) onJobPatched(context.jobId, { resumeScore: response.data.score, feedback: response.data.feedback })
        return response.data
      })

      const cover = await executeStep('cover', async () => {
        const formData = new FormData()
        formData.append('resumeFile', resumeFile)
        formData.append('jobDescription', context.jobDescription)
        formData.append('company', context.company)
        formData.append('position', context.position)
        formData.append('tone', 'professional')
        formData.append('matchContext', JSON.stringify(score))
        const response = await api.post('/ai/cover-letter-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        return response.data
      })

      const questions = await executeStep('questions', async () => {
        const response = await api.post('/ai/interview-questions', {
          jobDescription: context.jobDescription,
          matchContext: JSON.stringify(score),
        })
        return response.data
      })

      await executeStep('followup', async () => {
        const response = await api.post('/ai/follow-up-draft', {
          company: context.company || 'Hiring company',
          position: context.position || 'the role',
          status: 'Applied',
          daysSinceLastUpdate: 7,
          keySkills: score.matchedKeywords?.join(', '),
          pipelineContext: JSON.stringify({ coverLetter: cover.coverLetter?.slice(0, 600), questionCategories: questions.categories?.map((group) => group.category) }),
        })
        return response.data
      })
      notify('Agent pipeline complete — all four drafts are ready.')
    } catch (error) {
      notify(getError(error, 'The pipeline stopped. Your completed steps are still available.'), 'error')
    } finally {
      setRunning(false)
    }
  }

  const completed = steps.filter((step) => step.status === 'complete').length
  const active = steps.findIndex((step) => step.status === 'running')
  const progress = active >= 0 ? ((active + 0.45) / steps.length) * 100 : (completed / steps.length) * 100

  return (
    <section className="ai-panel pipeline-panel">
      <div className="agent-hero">
        <div>
          <span className="agent-badge"><Icon name="bolt" size={13} /> Multi-step agent</span>
          <h2>One job description. A complete application strategy.</h2>
          <p>Four connected AI tasks run in sequence, with each result informing the next step.</p>
        </div>
        <div className="agent-orchestration" aria-hidden="true"><span>JD</span><Icon name="arrowRight" /><span>Match</span><Icon name="arrowRight" /><span>Drafts</span></div>
      </div>

      <JobContextFields jobs={jobs} context={context} setContext={setContext} includeResume resumeFile={resumeFile} setResumeFile={setResumeFile} notify={notify} resumeId="pipeline-resume" />

      <div className="agent-launch">
        <div><span>4 specialized steps</span><small>Usually completes in under a minute</small></div>
        <button className="btn-primary" type="button" disabled={running || !resumeFile || !context.jobDescription.trim()} onClick={runPipeline}>
          <Icon name={running ? 'bolt' : 'pipeline'} size={17} />{running ? 'Agent is running…' : completed ? 'Run pipeline again' : 'Run AI pipeline'}
        </button>
      </div>

      <div className="agent-progress" aria-label={`${Math.round(progress)} percent complete`}><motion.span animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} /></div>
      <div className="agent-steps">
        {steps.map((step, index) => (
          <motion.article className={`agent-step agent-step-${step.status}`} layout key={step.id}>
            <div className="agent-step-rail"><span className="agent-step-icon">{step.status === 'complete' ? <Icon name="check" size={16} /> : <Icon name={step.icon} size={16} />}</span>{index < steps.length - 1 && <i />}</div>
            <div className="agent-step-main">
              <div className="agent-step-heading"><div><span>Step {step.number}</span><h3>{step.title}</h3><p>{step.description}</p></div><b>{step.status}</b></div>
              <PipelineOutput step={step} output={outputs[step.id]} onOutputChange={(output) => setOutputs((current) => ({ ...current, [step.id]: output }))} />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

function CoverLetterTool({ jobs, notify }) {
  const [context, setContext] = useState({ jobId: '', company: '', position: '', jobDescription: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [tone, setTone] = useState('professional')
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!resumeFile || !context.jobDescription.trim()) return notify('Add a resume and job description first.', 'error')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('resumeFile', resumeFile)
      Object.entries(context).forEach(([key, value]) => formData.append(key, value))
      formData.append('tone', tone)
      const response = await api.post('/ai/cover-letter-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setCoverLetter(response.data.coverLetter)
    } catch (error) {
      notify(getError(error, 'Cover letter generation failed.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(coverLetter); notify('Cover letter copied to your clipboard.') } catch { notify('Could not access the clipboard.', 'error') }
  }

  return (
    <section className="ai-panel">
      <div className="tool-heading"><span className="tool-heading-icon"><Icon name="document" size={21} /></span><div><h2>Tailored cover letter</h2><p>Generate an evidence-based first draft, then edit it until it sounds like you.</p></div></div>
      <JobContextFields jobs={jobs} context={context} setContext={setContext} includeResume resumeFile={resumeFile} setResumeFile={setResumeFile} notify={notify} resumeId="cover-resume" />
      <div className="tool-action-row">
        <div className="tone-toggle" aria-label="Cover letter tone"><button className={tone === 'professional' ? 'active' : ''} onClick={() => setTone('professional')} type="button">Professional</button><button className={tone === 'conversational' ? 'active' : ''} onClick={() => setTone('conversational')} type="button">Conversational</button></div>
        <button className="btn-primary" onClick={generate} disabled={loading || !resumeFile || !context.jobDescription.trim()} type="button"><Icon name={coverLetter ? 'refresh' : 'sparkles'} size={16} />{loading ? 'Writing draft…' : coverLetter ? 'Regenerate' : 'Generate cover letter'}</button>
      </div>
      {loading && <div className="ai-text-skeleton"><i /><i /><i /><i /><i /></div>}
      {coverLetter && !loading && <motion.div className="editable-output" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="output-header"><div><span className="eyebrow">Editable draft</span><h3>Your cover letter</h3></div><button className="btn-secondary" type="button" onClick={copy}><Icon name="copy" size={14} />Copy</button></div><textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows="18" /></motion.div>}
    </section>
  )
}

function InterviewTool({ jobs, notify }) {
  const [context, setContext] = useState({ jobId: '', company: '', position: '', jobDescription: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    if (!context.jobDescription.trim()) return notify('Add a job description first.', 'error')
    setLoading(true)
    try {
      const response = await api.post('/ai/interview-questions', { jobDescription: context.jobDescription })
      setResult(response.data)
    } catch (error) {
      notify(getError(error, 'Question generation failed.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ai-panel">
      <div className="tool-heading"><span className="tool-heading-icon"><Icon name="questions" size={21} /></span><div><h2>Interview question generator</h2><p>Practice the technical, behavioral, and role-specific questions most likely to come up.</p></div></div>
      <JobContextFields jobs={jobs} context={context} setContext={setContext} notify={notify} />
      <div className="tool-action-row tool-action-end"><button className="btn-primary" type="button" onClick={generate} disabled={loading || !context.jobDescription.trim()}><Icon name={result ? 'refresh' : 'sparkles'} size={16} />{loading ? 'Building question set…' : result ? 'Regenerate questions' : 'Generate questions'}</button></div>
      {loading && <div className="question-skeleton"><div className="ai-text-skeleton"><i /><i /><i /></div><div className="ai-text-skeleton"><i /><i /><i /></div></div>}
      {result && !loading && <motion.div className="interview-results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>{result.categories?.map((group, groupIndex) => <section className="question-category" key={group.category}><div className="question-category-heading"><span>{String(groupIndex + 1).padStart(2, '0')}</span><h3>{group.category}</h3></div><ol>{group.questions?.map((question) => <li key={question}><span>Q</span><p>{question}</p></li>)}</ol></section>)}{result.gapAreas?.length > 0 && <section className="gap-areas"><div><Icon name="alert" size={17} /><h3>Areas to prepare</h3></div>{result.gapAreas.map((gap) => <article key={gap.area}><strong>{gap.area}</strong><p>{gap.preparationTip}</p></article>)}</section>}</motion.div>}
    </section>
  )
}

function FollowUpTool({ jobs, notify, onJobUpdated }) {
  const [jobId, setJobId] = useState('')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const job = jobs.find((item) => item._id === jobId)

  const selectJob = (id) => {
    const selected = jobs.find((item) => item._id === id)
    setJobId(id)
    setRecipient(selected?.contactEmail || '')
    setSubject('')
    setBody('')
  }

  const generate = async () => {
    if (!job) return notify('Choose an application first.', 'error')
    setGenerating(true)
    try {
      const response = await api.post('/ai/follow-up-draft', {
        company: job.company,
        position: job.position,
        status: job.status,
        daysSinceLastUpdate: daysSince(job.statusUpdatedAt || job.updatedAt || job.appliedDate),
      })
      setSubject(response.data.subject)
      setBody(response.data.body)
    } catch (error) {
      notify(getError(error, 'Follow-up generation failed.'), 'error')
    } finally {
      setGenerating(false)
    }
  }

  const send = async () => {
    if (!job || !recipient || !subject.trim() || !body.trim()) return notify('Complete the recipient, subject, and email body.', 'error')
    setSending(true)
    try {
      const response = await api.post(`/jobs/${job._id}/follow-up/send`, { recipient, subject, body })
      onJobUpdated(response.data.job)
      notify(`Follow-up sent to ${recipient}.`)
    } catch (error) {
      notify(getError(error, 'Resend could not send this email.'), 'error')
    } finally {
      setSending(false)
    }
  }

  if (jobs.length === 0) return <EmptyState icon="mail" title="Add an application first" description="Follow-up drafts use the company, role, and status from a tracked application." />

  return (
    <section className="ai-panel">
      <div className="tool-heading"><span className="tool-heading-icon"><Icon name="mail" size={21} /></span><div><h2>Draft & send follow-up</h2><p>Generate a stage-aware message, edit every word, then send through your existing Resend connection.</p></div></div>
      <div className="followup-grid">
        <div className="followup-context">
          <label className="field"><span>Application</span><select value={jobId} onChange={(event) => selectJob(event.target.value)}><option value="">Choose an application</option>{jobs.map((item) => <option value={item._id} key={item._id}>{item.position} · {item.company}</option>)}</select></label>
          {job && <motion.div className="selected-job-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="company-mark">{job.company.charAt(0).toUpperCase()}</div><div><strong>{job.position}</strong><span>{job.company}</span></div><b>{job.status}</b><dl><div><dt>Last status update</dt><dd>{daysSince(job.statusUpdatedAt || job.updatedAt || job.appliedDate)} days ago</dd></div><div><dt>Last follow-up</dt><dd>{job.followUpSentAt ? new Date(job.followUpSentAt).toLocaleDateString() : 'Not sent yet'}</dd></div></dl></motion.div>}
          <button className="btn-secondary followup-generate" type="button" onClick={generate} disabled={!job || generating}><Icon name={subject ? 'refresh' : 'sparkles'} size={15} />{generating ? 'Drafting…' : subject ? 'Regenerate draft' : 'Generate AI draft'}</button>
        </div>
        <div className="email-composer">
          <label className="field"><span>Recipient</span><input type="email" placeholder="recruiter@company.com" value={recipient} onChange={(event) => setRecipient(event.target.value)} /></label>
          <label className="field"><span>Subject</span><input placeholder="Generate a draft or write your own" value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
          <label className="field composer-body"><span>Email body</span><textarea placeholder="Your editable follow-up will appear here…" value={body} onChange={(event) => setBody(event.target.value)} rows="13" /></label>
          <div className="composer-footer"><span><Icon name="alert" size={12} /> You approve every email before it sends.</span><button className="btn-primary" type="button" onClick={send} disabled={sending || !job || !recipient || !subject.trim() || !body.trim()}><Icon name="send" size={15} />{sending ? 'Sending with Resend…' : 'Send follow-up'}</button></div>
        </div>
      </div>
    </section>
  )
}

export default function AIWorkspace({ jobs, notify, onJobPatched, onJobUpdated, initialTool = 'pipeline' }) {
  const [tool, setTool] = useState(initialTool)
  const tools = [
    { id: 'pipeline', label: 'Agent pipeline', icon: 'pipeline' },
    { id: 'match', label: 'Resume match', icon: 'search' },
    { id: 'cover', label: 'Cover letter', icon: 'document' },
    { id: 'interview', label: 'Interview prep', icon: 'questions' },
    { id: 'followup', label: 'Follow-up', icon: 'mail' },
  ]

  return (
    <div className="ai-workspace">
      <div className="tool-tabs" role="tablist" aria-label="AI tools">
        {tools.map((item) => <button role="tab" aria-selected={tool === item.id} className={tool === item.id ? 'active' : ''} onClick={() => setTool(item.id)} type="button" key={item.id}><Icon name={item.icon} size={15} />{item.label}</button>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tool} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
          {tool === 'pipeline' && <AgentPipeline jobs={jobs} notify={notify} onJobPatched={onJobPatched} />}
          {tool === 'match' && <ResumeScorer jobs={jobs} notify={notify} onJobPatched={onJobPatched} />}
          {tool === 'cover' && <CoverLetterTool jobs={jobs} notify={notify} />}
          {tool === 'interview' && <InterviewTool jobs={jobs} notify={notify} />}
          {tool === 'followup' && <FollowUpTool jobs={jobs} notify={notify} onJobUpdated={onJobUpdated} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
