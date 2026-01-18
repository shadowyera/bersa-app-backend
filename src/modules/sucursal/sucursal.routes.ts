import { Router } from 'express';
import { getSucursales, createSucursal, updateSucursal, deleteSucursal } from './sucursal.controller';

const router = Router();

router.get('/api/sucursales', getSucursales);
router.post('/api/sucursales', createSucursal);
router.put('/api/sucursales/:id', updateSucursal);
router.delete('/api/sucursales/:id', deleteSucursal);

export default router;
