import { Router } from 'express';
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleProveedorActivo,
} from './proveedor.controller';

const router = Router();

router.get('/api/proveedores', getProveedores);
router.post('/api/proveedores', createProveedor);
router.put('/api/proveedores/:id', updateProveedor);
router.patch('/api/proveedores/:id/activar', toggleProveedorActivo);

export default router;