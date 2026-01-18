// src/modules/stock/stock.routes.ts
import { Router } from 'express';
import {
  getStockBySucursal,
  getStockByProducto,
  updateStockHabilitado,
} from './stock.controller';

const router = Router();

router.get('/api/stock/sucursal/:sucursalId', getStockBySucursal);
router.get('/api/stock/producto/:productoId', getStockByProducto);
router.put('/api/stock/:stockId/habilitado', updateStockHabilitado);

export default router;
