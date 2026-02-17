import { Router } from 'express'
import { getCorteCajerosController } from './corteCaja.controller'
import { getVentasAperturaController } from './corteCaja.ventas.controller'

const router = Router()

// Corte por cajero (lo que ya tienes)
router.get(
  '/api/cajas/:cajaId/corte-cajeros',
  getCorteCajerosController
)

// ✅ NUEVO: listado de ventas del turno
router.get(
  '/api/cajas/:cajaId/ventas-apertura',
  getVentasAperturaController
)

export default router