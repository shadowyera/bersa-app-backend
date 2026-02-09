import { Router } from 'express'
import { getAperturasActivasController } from './aperturasActivas.controller'

const router = Router()

/**
 * GET /api/aperturas/activas?sucursalId=...
 * Snapshot completo de aperturas activas
 */
router.get(
  '/api/aperturas/activas',
  getAperturasActivasController
)

export default router