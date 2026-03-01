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

    const sucursalId = req.user?.sucursal.id

    if (!sucursalId) {
      return res
        .status(400)
        .json({ message: 'Sucursal no encontrada' })
    }

    registerSSEClient(
      req,
      res,
      sucursalId
    )
  }
)

export default router