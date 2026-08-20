const express = require('express')
const router = express.Router()
const Groq = require('groq-sdk')
const multer = require('multer')
const { extractResumeText } = require('../utils/resumeParser')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// multer.memoryStorage() keeps the uploaded file in RAM as a Buffer instead
// of writing it to disk. We don't need to persist the raw file anywhere —
// we only need it briefly to extract text, so this is simpler and faster
// than disk storage, and avoids leaving resume files sitting on the server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap - resumes are never bigger than this
})

// Shared scoring logic, used by both the JSON (paste-text) and file-upload routes
// so we only maintain the Groq prompt in one place.
async function scoreResumeAgainstJob(resume, jobDescription) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b', // Groq deprecated llama-3.1-8b-instant on June 17, 2026; this is their recommended replacement
    messages: [
      {
        role: 'user',
        content: `You are an expert resume reviewer and ATS system.
          
Analyze this resume against the job description and respond in this EXACT JSON format with no extra text and no markdown backticks:
{
  "score": <number between 0-100>,
  "matchedKeywords": [<list of keywords from job description found in resume>],
  "missingKeywords": [<list of important keywords from job description missing in resume>],
  "feedback": "<2-3 sentences of specific actionable feedback>",
  "verdict": "<one of: Strong Match, Good Match, Partial Match, Weak Match>"
}

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}`
      }
    ],
    temperature: 0.3
  })

  const text = completion.choices[0].message.content
  const cleanText = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleanText)
}

router.post('/score', async (req, res) => {
  const { resume, jobDescription } = req.body

  if (!resume || !jobDescription) {
    return res.status(400).json({
      message: 'Resume and job description are required'
    })
  }

  try {
    const analysis = await scoreResumeAgainstJob(resume, jobDescription)
    res.json(analysis)
  } catch (err) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message })
  }
})

// NEW: accepts an actual PDF/DOCX file upload instead of pasted text.
// `upload.single('resumeFile')` is multer middleware that runs BEFORE our
// handler - it intercepts the multipart/form-data request, pulls out the
// file matching the field name "resumeFile", and attaches it to req.file
// as { buffer, mimetype, originalname, size, ... }. jobDescription still
// arrives as a normal text field on req.body since multer parses both.
router.post('/score-file', upload.single('resumeFile'), async (req, res) => {
  const { jobDescription } = req.body
  const file = req.file

  if (!file) {
    return res.status(400).json({ message: 'Resume file is required' })
  }
  if (!jobDescription) {
    return res.status(400).json({ message: 'Job description is required' })
  }

  try {
    const resumeText = await extractResumeText(file.buffer, file.mimetype)

    if (!resumeText || resumeText.length < 20) {
      return res.status(400).json({
        message: 'Could not extract readable text from this file. Try a different file or paste your resume text instead.'
      })
    }

    const analysis = await scoreResumeAgainstJob(resumeText, jobDescription)
    res.json(analysis)
  } catch (err) {
    res.status(500).json({ message: err.message || 'AI analysis failed' })
  }
})

module.exports = router