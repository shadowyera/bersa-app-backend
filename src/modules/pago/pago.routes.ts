import { Router } from 'express';
import { registrarPagosVentaController } from './pago.controller';

const router = Router();

router.post(
  '/api/ventas/:ventaId/pagos',
  registrarPagosVentaController
);

export default router;
