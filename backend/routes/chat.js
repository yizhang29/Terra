import { Router } from 'express'
import { client, getModel, buildSystemPrompt, buildMessages } from '../services/llm.js'

const router = Router()

router.post('/', async (req, res) => {
  const { messages, stravaData, userProfile, tier } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const activities = stravaData || []
  const profile = userProfile || {}
  const modelTier = tier || 'fast'

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  req.on('close', () => {
    console.log('Client disconnected')
  })

  try {
    const systemPrompt = buildSystemPrompt(activities, profile)
    const formattedMessages = buildMessages(systemPrompt, messages)

    const stream = await client.chat.completions.create({
      model: getModel(modelTier),
      stream: true,
      messages: formattedMessages,
      max_tokens: 1024,
      temperature: 0.7
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()

  } catch (err) {
    console.error('Chat error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'LLM unavailable, please try again' })
    } else {
      res.write('data: {"error":"Stream interrupted"}\n\n')
      res.end()
    }
  }
})

export default router