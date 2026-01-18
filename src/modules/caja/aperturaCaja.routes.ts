import { Router } from 'express';
import {
  abrirCajaController,
  getAperturaActivaController,
} from './aperturaCaja.controller';

const router = Router();

router.post('/api/cajas/:cajaId/abrir', abrirCajaController);
router.get('/api/cajas/:cajaId/apertura-activa', getAperturaActivaController);

export default router;