const express = require('express')
const router = express.Router()
const Job = require('../models/Job')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { sendStatusEmail } = require('../utils/emailService')

router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.id })
    res.json(jobs)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  const job = new Job({
    company: req.body.company,
    position: req.body.position,
    status: req.body.status,
    jobDescription: req.body.jobDescription,
    userId: req.user.id
  })
  try {
    const newJob = await job.save()
    res.status(201).json(newJob)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!job) return res.status(404).json({ message: 'Job not found' })

    if (req.body.status === 'Interview' || req.body.status === 'Offer') {
      try {
        const user = await User.findById(req.user.id)
        await sendStatusEmail(user.email, {
          position: job.position,
          company: job.company,
          status: job.status
        })
        console.log(`Email sent to ${user.email} for ${job.status}`)
      } catch (emailErr) {
        console.log('Email failed:', emailErr.message)
      }
    }

    res.json(job)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
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