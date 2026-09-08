const mongoose = require('mongoose')

const FollowUpSchema = new mongoose.Schema({
  sentAt: {
    type: Date,
    default: Date.now
  },
  recipient: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  }
}, { _id: false })

const JobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'],
    default: 'Applied'
  },
  jobDescription: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: '',
    trim: true
  },
  resumeScore: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  followUpSentAt: {
    type: Date,
    default: null
  },
  followUpHistory: {
    type: [FollowUpSchema],
    default: []
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  sourcePlatform: {
    type: String,
    enum: ['', 'LinkedIn', 'Naukri', 'Manual', 'Extension'],
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Job', JobSchema)
