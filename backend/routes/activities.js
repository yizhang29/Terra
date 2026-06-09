import { Router } from 'express'
const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'activities coming soon' })
})

export default router