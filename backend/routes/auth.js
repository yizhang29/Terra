import { Router } from 'express'
const router = Router()

router.get('/strava', (req, res) => {
  res.json({ message: 'auth coming soon' })
})

export default router