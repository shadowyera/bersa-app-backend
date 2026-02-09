import { Types } from 'mongoose'

import type {
  PedidoInterno,
  PedidoInternoItem,
} from './pedido-interno.types'

/* =====================================================
   Helpers
===================================================== */

/**
 * Normaliza un ObjectId o string a string plano.
 */
function normalizeId(id: Types.ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString()
}

/* =====================================================
   Serializador de Item (SNAPSHOT HISTÓRICO)
===================================================== */

/**
 * Convierte un item embebido del modelo de Pedido Interno
 * al contrato de lectura usado por el frontend.
 *
 * IMPORTANTE:
 * - Pedido Interno NO usa populate
 * - El producto se representa como snapshot
 */
function serializePedidoInternoItem(
  item: any
): PedidoInternoItem {
  return {
    // referencia técnica
    productoId: normalizeId(item.productoId),

    // snapshot histórico
    productoNombre: item.productoNombre,
    unidadBase: item.unidadBase,

    cantidadSolicitada: item.cantidadSolicitada,
    unidadPedido: item.unidadPedido,
    factorUnidad: item.factorUnidad,
    cantidadBaseSolicitada:
      item.cantidadBaseSolicitada,

    cantidadPreparada: item.cantidadPreparada,
  }
}

/* =====================================================
   Serializador principal
===================================================== */

/**
 * Serializa un Pedido Interno desde Mongo/Mongoose
 * hacia el contrato HTTP definido en pedido-interno.types.ts
 *
 * Regla clave:
 * - El frontend NUNCA debe recibir `_id`
 */
export function serializePedidoInterno(
  pedido: any
): PedidoInterno {
  return {
    id: normalizeId(pedido._id),

    sucursalSolicitanteId: normalizeId(
      pedido.sucursalSolicitanteId
    ),

    sucursalAbastecedoraId: normalizeId(
      pedido.sucursalAbastecedoraId
    ),

    estado: pedido.estado,

    items: pedido.items.map(
      serializePedidoInternoItem
    ),

    createdAt: pedido.createdAt.toISOString(),
    updatedAt: pedido.updatedAt.toISOString(),
  }
}

/* =====================================================
   Serializador de listas
===================================================== */

/**
 * Serializa una lista de pedidos internos.
 */
export function serializePedidosInternos(
  pedidos: any[]
): PedidoInterno[] {
  return pedidos.map(serializePedidoInterno)
}
