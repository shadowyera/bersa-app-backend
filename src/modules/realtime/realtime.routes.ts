import { Router } from 'express'
import { registerSSEClient } from './realtime.service'
import { authMiddleware } from '../auth/auth.middleware'

const router = Router()

/**
 * SSE para eventos de caja por sucursal
 * GET /api/realtime/cajas
 */
router.get('/cajas', authMiddleware, (req, res) => {
  const sucursalId = req.user?.sucursalId

  if (!sucursalId) {
    return res.status(400).json({ message: 'Sucursal no encontrada' })
  }

  registerSSEClient(req, res, sucursalId)
})

export default router