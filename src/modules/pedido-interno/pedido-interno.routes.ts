import { Router } from 'express'
import { requireRole } from '../auth/requireRole'

import {
  crearPedido,
  editarPedido,
  cancelarPedido,
  listarPedidosPropios,
  listarPedidosRecibidos,
  prepararPedido,
} from './pedido-interno.controller'

import {
  obtenerPreparacionPedido,
} from './preparacion/pedido-interno-preparacion.controller'

import {
  listarCatalogoParaPedido,
} from './catalogo/catalogo-pedido.controller'

const router = Router()

/* =====================================================
   PEDIDOS INTERNOS – QUERIES (LECTURA)
===================================================== */

/* =====================================================
   Catálogo para crear pedido interno
   - Vista sucursal DESTINO
   - Fuente: StockSucursal
===================================================== */
router.get(
  '/api/pedidos-internos/catalogo',
  requireRole(['ENCARGADO', 'ADMIN']),
  listarCatalogoParaPedido
)

/* =====================================================
   Pedidos creados por mi sucursal
   - Vista sucursal DESTINO
===================================================== */
router.get(
  '/api/pedidos-internos/mios',
  requireRole(['ENCARGADO', 'ADMIN']),
  listarPedidosPropios
)

/* =====================================================
   Pedidos que debo abastecer
   - Vista bodega / sucursal MAIN
===================================================== */
router.get(
  '/api/pedidos-internos/recibidos',
  requireRole(['BODEGUERO', 'ENCARGADO', 'ADMIN']),
  listarPedidosRecibidos
)

/* =====================================================
   Vista de preparación de pedido (ENRIQUECIDA)
   - SOLO lectura
   - Incluye categoría y proveedor
===================================================== */
router.get(
  '/api/pedidos-internos/:id/preparacion',
  requireRole(['BODEGUERO', 'ADMIN']),
  obtenerPreparacionPedido
)

/* =====================================================
   PEDIDOS INTERNOS – COMMANDS (MUTACIÓN)
===================================================== */

/* =====================================================
   Crear pedido interno
   - Sucursal solicita mercadería
===================================================== */
router.post(
  '/api/pedidos-internos',
  requireRole(['ENCARGADO', 'ADMIN']),
  crearPedido
)

/* =====================================================
   Editar pedido interno
   - Solo estado CREADO
===================================================== */
router.put(
  '/api/pedidos-internos/:id',
  requireRole(['ENCARGADO', 'ADMIN']),
  editarPedido
)

/* =====================================================
   Cancelar pedido interno
   - Solo estado CREADO
===================================================== */
router.post(
  '/api/pedidos-internos/:id/cancelar',
  requireRole(['ENCARGADO', 'ADMIN']),
  cancelarPedido
)

/* =====================================================
   Preparar pedido interno
   - Bodega decide cantidades
   - Estado pasa a PREPARADO
===================================================== */
router.post(
  '/api/pedidos-internos/:id/preparar',
  requireRole(['BODEGUERO', 'ADMIN']),
  prepararPedido
)

export default router