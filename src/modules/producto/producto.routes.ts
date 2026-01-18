import { Router } from 'express'
import {
  getProductos,
  createProducto,
  updateProducto,
  buscarProductoPorCodigo,
  setProductoActivo,
} from './producto.controller'

const router = Router()

// =======================================
// GET – productos
// =======================================

// POS → solo productos activos
router.get('/api/productos', getProductos)

// Buscar por código (POS / scanner)
router.get('/api/productos/buscar/:codigo', buscarProductoPorCodigo)

// =======================================
// ADMIN – productos
// =======================================

// Crear producto (inicializa stock por sucursal)
router.post('/api/productos', createProducto)

// Editar producto
router.put('/api/productos/:id', updateProducto)

// Activar / Desactivar producto (soft)
router.patch('/api/productos/:id/activo', setProductoActivo)

export default router