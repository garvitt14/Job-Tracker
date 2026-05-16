const express = require('express')
const router = express.Router()
const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/score', async (req, res) => {
  const { resume, jobDescription } = req.body

  if (!resume || !jobDescription) {
    return res.status(400).json({
      message: 'Resume and job description are required'
    })
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
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
    const analysis = JSON.parse(cleanText)

    res.json(analysis)

  } catch (err) {
    res.status(500).json({ message: 'AI analysis failed', error: err.message })
  }
})

module.exports = router