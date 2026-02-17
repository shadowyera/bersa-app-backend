import { Router } from 'express'

import {
  createVentaPOS,
  anularVentaController,
  getVentaDetalleController,
  listarVentasAdminController,
} from './venta.controller'
import { requireRole } from '../auth/roles'
import { authMiddleware } from '../auth/auth.middleware'

const router = Router()

/* ================================
   VENTAS POS
================================ */

// Crear venta
router.post(
  '/api/ventas',
  createVentaPOS
)

// Anular venta
router.post(
  '/api/ventas/:ventaId/anular',
  anularVentaController
)

router.get(
  '/api/ventas/:ventaId/detalle',
  getVentaDetalleController
)

router.get(
  '/api/admin/ventas',
  authMiddleware,
  requireRole(['ADMIN', 'ENCARGADO']),
  listarVentasAdminController
)

export default router