import { Router } from 'express'
import {
  cerrarCajaController,
  resumenPrevioCajaController,
} from './cierreCaja.controller'

const router = Router()

/**
 * GET /api/cajas/:cajaId/resumen-previo
 * Obtiene resumen antes del cierre
 */
router.get(
  '/api/cajas/:cajaId/resumen-previo',
  resumenPrevioCajaController
)

/**
 * POST /api/cajas/:cajaId/cierre
 * Cierra la caja
 */
router.post(
  '/api/cajas/:cajaId/cierre',
  cerrarCajaController
)

export default router