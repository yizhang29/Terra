import OpenAI from 'openai'
import dotenv from 'dotenv'
dotenv.config()

const USE_LOCAL = process.env.USE_LOCAL_LLM === 'true'

const localClient = new OpenAI({
  baseURL: 'http://localhost:1234/v1',
  apiKey: 'lm-studio'
})

const cloudClient = new OpenAI({
  baseURL: 'https://api.anthropic.com/v1',
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-version': '2023-06-01'
  }
})

const MODELS = {
  local: process.env.LM_STUDIO_MODEL || 'google/gemma-4-e4b',
  fast: 'claude-haiku-4-5-20251001',
  balanced: 'claude-sonnet-4-6',
  powerful: 'claude-opus-4-7'
}

export const client = USE_LOCAL ? localClient : cloudClient

export function getModel(tier = 'fast') {
  if (USE_LOCAL) return MODELS.local
  return MODELS[tier] || MODELS.fast
}

export function buildSystemPrompt(stravaActivities = [], userProfile = {}) {
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const weeklyKm = stravaActivities
    .filter(a => new Date(a.start_date) > weekAgo)
    .reduce((sum, a) => sum + (a.distance || 0) / 1000, 0)
    .toFixed(1)

  const recentRuns = stravaActivities
    .filter(a => a.type === 'Run')
    .slice(0, 3)

  const avgHR = recentRuns.length > 0
    ? Math.round(recentRuns.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / recentRuns.length)
    : null

  const recoveryFlag = avgHR && avgHR > 155
    ? '⚠️ Recovery risk: HR elevated across last 3 runs'
    : '✅ Recovery looks good'

  const last5 = stravaActivities.slice(0, 5).map(a =>
    `- ${(a.start_date || '').slice(0, 10)} | ${a.type} | ${((a.distance || 0) / 1000).toFixed(1)}km | HR: ${a.average_heartrate || 'n/a'} bpm`
  )

  return `You are Pace, a warm, knowledgeable, and reliable AI fitness and nutrition coach inside the Brio app. You are friendly and supportive, never judgmental. Be specific, actionable, and evidence-based. Keep responses concise (3-5 sentences) unless the user asks for a full plan. Never give medical diagnoses.

User profile:
- Name: ${userProfile.name || 'Athlete'}
- Goal: ${userProfile.goal || 'General fitness'}
- Weight: ${userProfile.weight_kg || 'unknown'} kg

This week's training:
- Total distance: ${weeklyKm} km
- ${recoveryFlag}
- Avg HR last 3 runs: ${avgHR || 'unknown'} bpm

Recent activities:
${last5.join('\n')}

Always consider recovery, nutrition, and training load together.`
}

export function buildMessages(systemPrompt, messages) {
  const isGemma = (process.env.LM_STUDIO_MODEL || '').toLowerCase().includes('gemma')

  if (USE_LOCAL && isGemma) {
    const firstUserMsg = messages[0]?.content || ''
    return [
      {
        role: 'user',
        content: `[System: ${systemPrompt}]\n\n${firstUserMsg}`
      },
      ...messages.slice(1)
    ]
  }

  return [
    { role: 'system', content: systemPrompt },
    ...messages
  ]
}

export function logProvider() {
  if (USE_LOCAL) {
    console.log(`LLM provider: LM Studio (local) → ${MODELS.local}`)
  } else {
    console.log(`LLM provider: Anthropic → ${MODELS.fast}`)
  }
}