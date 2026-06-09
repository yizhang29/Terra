import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import session from 'express-session'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import activitiesRoutes from './routes/activities.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'brio-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}))

app.use('/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/activities', activitiesRoutes)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Brio',
    provider: process.env.USE_LOCAL_LLM === 'true'
      ? 'LM Studio (local)'
      : 'Anthropic (cloud)',
    model: process.env.LM_STUDIO_MODEL || 'claude-haiku-4-5-20251001'
  })
})

app.use(express.static('frontend'))

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: err.message || 'Server error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Brio running on http://localhost:${PORT}`)
  console.log(`LLM: ${process.env.USE_LOCAL_LLM === 'true'
    ? 'LM Studio → ' + process.env.LM_STUDIO_MODEL
    : 'Anthropic cloud'}`)
})