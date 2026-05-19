import { Router } from 'express'
import {
  listarProveedoresController,
  crearProveedorController,
  actualizarProveedorController,
  toggleProveedorActivoController,
} from './proveedor.controller'

const router = Router()

router.get(
  '/api/admin/proveedores',
  listarProveedoresController
)

router.post(
  '/api/admin/proveedores',
  crearProveedorController
)

router.put(
  '/api/admin/proveedores/:id',
  actualizarProveedorController
)

router.patch(
  '/api/admin/proveedores/:id/activo',
  toggleProveedorActivoController
)

export default router