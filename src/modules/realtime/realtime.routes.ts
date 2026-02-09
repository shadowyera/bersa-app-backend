import { Router, Request, Response } from 'express'
import { registerSSEClient } from './realtime.service'
import { authMiddleware } from '../auth/auth.middleware'

const router = Router()

/**
 * GET /api/realtime
 */
router.get(
  '/',
  authMiddleware,
  (req: Request, res: Response) => {
    const sucursalId = req.user?.sucursalId

    if (!sucursalId) {
      return res
        .status(400)
        .json({ message: 'Sucursal no encontrada' })
    }

    // 🔥 FIX CLAVE:
    // SIEMPRE registrar con STRING
    registerSSEClient(
      req,
      res,
      sucursalId.toString()
    )
  }
)

export default router