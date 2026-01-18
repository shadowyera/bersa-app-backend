import { Router } from 'express';
import { createMovimiento, getMovimientos } from './movimiento.controller';

const router = Router();

// Registrar movimiento (Kardex)
router.post('/api/movimientos', createMovimiento);
router.get('/api/movimientos/sucursal/:sucursalId', getMovimientos);
router.get('/api/movimientos/producto/:productoId', getMovimientos);

export default router;
