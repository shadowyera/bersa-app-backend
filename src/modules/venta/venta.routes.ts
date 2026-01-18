import { Router } from 'express';
import {createVentaPOS} from './venta.controller';

const router = Router();

router.post('/api/ventas/pos', createVentaPOS);

export default router;
