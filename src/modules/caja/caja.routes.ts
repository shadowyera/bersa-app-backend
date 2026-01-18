import { Router } from 'express';
import {
  createCaja,
  getCajas,
  toggleCaja,
} from './caja.controller';

const router = Router();

router.post('/api/cajas', createCaja);
router.get('/api/cajas', getCajas);
router.patch('/api/cajas/:cajaId/toggle', toggleCaja);

export default router;
