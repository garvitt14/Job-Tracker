const express = require('express')
const router = express.Router()
const Job = require('../models/Job')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { sendStatusEmail, sendFollowUpEmail } = require('../utils/emailService')

const JOB_FIELDS = [
  'company',
  'position',
  'status',
  'jobDescription',
  'contactEmail',
  'sourceUrl',
  'sourcePlatform'
]

const pickJobFields = (body) => Object.fromEntries(
  JOB_FIELDS.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
)

router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id }).sort({ appliedDate: -1 })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  const job = new Job({
    ...pickJobFields(req.body),
    userId: req.user.id
  })

  try {
    const newJob = await job.save()
    res.status(201).json(newJob)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:id/follow-up/send', auth, async (req, res) => {
  const { recipient, subject, body } = req.body
  if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
    return res.status(400).json({ message: 'A valid recipient email is required' })
  }
  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'Email subject and body are required' })
  }

  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found' })

    await sendFollowUpEmail(recipient.trim(), {
      subject: subject.trim(),
      body: body.trim()
    })

    const sentAt = new Date()
    job.contactEmail = recipient.trim()
    job.followUpSentAt = sentAt
    job.lastActivityAt = sentAt
    job.followUpHistory.push({ sentAt, recipient: recipient.trim(), subject: subject.trim() })
    if (job.followUpHistory.length > 10) job.followUpHistory = job.followUpHistory.slice(-10)
    await job.save()

    res.json({ message: 'Follow-up sent', job })
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not send follow-up email' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user.id })
    if (!job) return res.status(404).json({ message: 'Job not found' })

    const previousStatus = job.status
    Object.assign(job, pickJobFields(req.body))
    const statusChanged = req.body.status !== undefined && req.body.status !== previousStatus
    if (statusChanged) {
      job.statusUpdatedAt = new Date()
      job.lastActivityAt = new Date()
    }
    await job.save()

    if (statusChanged && (job.status === 'Interview' || job.status === 'Offer')) {
      User.findById(req.user.id).then((user) => {
        if (!user) return
        sendStatusEmail(user.email, {
          position: job.position,
          company: job.company,
          status: job.status
        }).catch((emailErr) => console.log('Status email failed:', emailErr.message))
      }).catch((emailErr) => console.log('Could not load email recipient:', emailErr.message))
    }

    res.json(job)
  } catch (err) {
    const status = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500
    res.status(status).json({ message: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
