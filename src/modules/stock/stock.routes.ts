// src/modules/stock/stock.routes.ts

import { Router } from 'express'

import {
  getAdminStock,
  getStockBySucursal,
  updateStockHabilitado,
} from './stock.controller'

const router = Router()

/* ======================================================
   POS
===================================================== */

/**
 * Obtiene stock vendible por sucursal
 */
router.get(
  '/api/stock/sucursal/:sucursalId',
  getStockBySucursal
)

/* ======================================================
   ADMIN
===================================================== */

/**
 * Habilita / deshabilita producto en sucursal
 */
router.put(
  '/api/stock/:stockId/habilitado',
  updateStockHabilitado
)

router.get(
  '/api/admin/stock',
  getAdminStock
)

export default router