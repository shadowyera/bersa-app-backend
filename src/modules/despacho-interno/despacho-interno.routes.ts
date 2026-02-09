import { Router } from 'express'
import {
  crearDespachoInternoController,
  listarDespachosInternosController,
  getDespachoInternoByIdController,
} from './despacho-interno.controller'
import { requireRole } from '../auth/requireRole'

const router = Router()

/* =====================================================
   LISTAR despachos internos
===================================================== */
router.get(
  '/api/despachos-internos',
  requireRole(['ADMIN', 'BODEGUERO', 'ENCARGADO']),
  listarDespachosInternosController
)

/* =====================================================
   OBTENER despacho interno por ID
===================================================== */
router.get(
  '/api/despachos-internos/:id',
  requireRole(['ADMIN', 'BODEGUERO', 'ENCARGADO']),
  getDespachoInternoByIdController
)

/* =====================================================
   CREAR despacho interno
   - PEDIDO
   - PEDIDO + SUPLENTE
   - DIRECTO
===================================================== */
router.post(
  '/api/despachos-internos',
  requireRole(['ADMIN', 'BODEGUERO']),
  crearDespachoInternoController
)

export default router