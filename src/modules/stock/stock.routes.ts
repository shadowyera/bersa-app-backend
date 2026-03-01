import { Router } from 'express'
import {
  ajustarStockAdmin,
  getAdminStock,
  getStockBySucursal,
  updateStockHabilitado,
} from './stock.controller'

const router = Router()

/* ======================================================
   POS
===================================================== */

router.get(
  '/api/stock/sucursal/:sucursalId',
  getStockBySucursal
)

/* ======================================================
   ADMIN
===================================================== */

router.get(
  '/api/admin/stock',
  getAdminStock
)

router.put(
  '/api/stock/:stockId/habilitado',
  updateStockHabilitado
)

router.post(
  '/api/admin/stock/:stockId/ajuste',
  ajustarStockAdmin
)

export default router