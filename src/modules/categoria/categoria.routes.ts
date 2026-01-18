import { Router } from 'express'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  setCategoriaActiva
} from './categoria.controller'

const router = Router()

// POS → solo categorías activas
router.get('/api/categorias', getCategorias)

// Crear categoría
router.post('/api/categorias', createCategoria)

// Editar categoría
router.put('/api/categorias/:id', updateCategoria)

// activar / desactivar
router.patch('/api/categorias/:id/activo', setCategoriaActiva)

export default router