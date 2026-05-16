const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Interview', 'Offer', 'Rejected'],
    default: 'Applied'
  },
  jobDescription: {
    type: String,
    default: ''
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
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
}
  
})

module.exports = mongoose.model('Job', JobSchema)