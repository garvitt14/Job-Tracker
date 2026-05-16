const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err))

const jobsRouter = require('./routes/jobs')
app.use('/api/jobs', jobsRouter)

const aiRouter = require('./routes/ai')
app.use('/api/ai', aiRouter)

const authRouter = require('./routes/auth')
app.use('/api/auth', authRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})