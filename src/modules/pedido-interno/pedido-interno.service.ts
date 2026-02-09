import { Types } from 'mongoose'

import { PedidoInternoModel } from './pedido-interno.model'
import { ESTADO_PEDIDO_INTERNO } from './pedido-interno.types'
import ProductoModel from '../producto/producto.model'

/* =====================================================
   Types internos
===================================================== */

interface CrearPedidoInternoInput {
  sucursalSolicitanteId: string
  sucursalAbastecedoraId: string
  items: {
    productoId: string
    cantidadSolicitada: number
  }[]
}

/* =====================================================
   Helpers internos
===================================================== */

function resolveUnidadLogistica(producto: any) {
  if (
    producto.unidadLogistica &&
    typeof producto.unidadLogistica.factorUnidad ===
      'number' &&
    producto.unidadLogistica.factorUnidad > 0
  ) {
    return producto.unidadLogistica
  }

  // fallback defensivo
  return {
    unidadPedido: 'UNIDAD',
    factorUnidad: 1,
  }
}

/* =====================================================
   Crear pedido interno
===================================================== */
/**
 * Crea un pedido interno desde una sucursal solicitante.
 *
 * Reglas:
 * - Sucursal solicitante ≠ sucursal abastecedora
 * - Pedido nace en estado CREADO
 * - Es editable mientras esté en CREADO
 */
export async function crearPedidoInterno(
  input: CrearPedidoInternoInput
) {
  const {
    sucursalSolicitanteId,
    sucursalAbastecedoraId,
    items,
  } = input

  if (
    sucursalSolicitanteId ===
    sucursalAbastecedoraId
  ) {
    throw new Error(
      'Sucursal solicitante y abastecedora no pueden ser la misma'
    )
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      'El pedido debe contener al menos un item'
    )
  }

  const itemsProcesados: {
    productoId: Types.ObjectId
    productoNombre: string
    unidadBase: string
    cantidadSolicitada: number
    unidadPedido: string
    factorUnidad: number
    cantidadBaseSolicitada: number
  }[] = []

  for (const item of items) {
    const producto = await ProductoModel.findById(
      item.productoId
    )

    if (!producto) {
      throw new Error(
        `Producto no encontrado: ${item.productoId}`
      )
    }

    const unidadLogistica =
      resolveUnidadLogistica(producto)

    const cantidadBaseSolicitada =
      item.cantidadSolicitada *
      unidadLogistica.factorUnidad

    if (
      Number.isNaN(cantidadBaseSolicitada) ||
      cantidadBaseSolicitada <= 0
    ) {
      throw new Error(
        `Cantidad inválida para producto ${producto.nombre}`
      )
    }

    itemsProcesados.push({
      productoId: producto._id,

      // 🔑 SNAPSHOT (CLAVE 2026)
      productoNombre: producto.nombre,
      unidadBase: producto.unidadBase,

      cantidadSolicitada: item.cantidadSolicitada,
      unidadPedido: unidadLogistica.unidadPedido,
      factorUnidad: unidadLogistica.factorUnidad,
      cantidadBaseSolicitada,
    })
  }

  return PedidoInternoModel.create({
    sucursalSolicitanteId,
    sucursalAbastecedoraId,
    estado: ESTADO_PEDIDO_INTERNO.CREADO,
    items: itemsProcesados,
  })
}

/* =====================================================
   Editar pedido interno
===================================================== */
/**
 * Permite editar un pedido SOLO mientras esté en estado CREADO.
 *
 * Reglas:
 * - Solo la sucursal solicitante puede editar
 * - Se reemplazan completamente los items
 */
export async function editarPedidoInterno(
  pedidoId: string,
  sucursalSolicitanteId: string,
  items: {
    productoId: string
    cantidadSolicitada: number
  }[]
) {
  const pedido = await PedidoInternoModel.findById(
    pedidoId
  )

  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (
    pedido.sucursalSolicitanteId.toString() !==
    sucursalSolicitanteId
  ) {
    throw new Error('No autorizado')
  }

  if (pedido.estado !== ESTADO_PEDIDO_INTERNO.CREADO) {
    throw new Error(
      'El pedido no puede ser editado en este estado'
    )
  }

  const pedidoReprocesado = await crearPedidoInterno({
    sucursalSolicitanteId,
    sucursalAbastecedoraId:
      pedido.sucursalAbastecedoraId.toString(),
    items,
  })

  pedido.items = pedidoReprocesado.items
  await pedido.save()

  return pedido
}

/* =====================================================
   Cancelar pedido interno
===================================================== */
/**
 * Cancela un pedido antes de ser preparado o despachado.
 */
export async function cancelarPedidoInterno(
  pedidoId: string,
  sucursalSolicitanteId: string
) {
  const pedido = await PedidoInternoModel.findById(
    pedidoId
  )

  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (
    pedido.sucursalSolicitanteId.toString() !==
    sucursalSolicitanteId
  ) {
    throw new Error('No autorizado')
  }

  if (pedido.estado !== ESTADO_PEDIDO_INTERNO.CREADO) {
    throw new Error(
      'El pedido no puede ser cancelado en este estado'
    )
  }

  pedido.estado = ESTADO_PEDIDO_INTERNO.CANCELADO
  await pedido.save()

  return pedido
}

/* =====================================================
   Preparar pedido interno (bodega)
===================================================== */
/**
 * La bodega decide cuánto puede preparar de cada item.
 */
export async function prepararPedidoInterno(
  pedidoId: string,
  itemsPreparados: {
    productoId: string
    cantidadPreparada: number
  }[],
  sucursalAbastecedoraId: string
) {
  const pedido = await PedidoInternoModel.findById(
    pedidoId
  )

  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (
    pedido.sucursalAbastecedoraId.toString() !==
    sucursalAbastecedoraId
  ) {
    throw new Error(
      'No autorizado para preparar este pedido'
    )
  }

  if (pedido.estado !== ESTADO_PEDIDO_INTERNO.CREADO) {
    throw new Error(
      'El pedido no puede ser preparado en este estado'
    )
  }

  pedido.items.forEach(item => {
    const preparado = itemsPreparados.find(
      i =>
        i.productoId ===
        item.productoId.toString()
    )

    item.cantidadPreparada =
      preparado?.cantidadPreparada ?? 0
  })

  pedido.estado = ESTADO_PEDIDO_INTERNO.PREPARADO
  await pedido.save()

  return pedido
}

/* =====================================================
   Queries (SIN populate – pedido es histórico)
===================================================== */

/**
 * Pedidos creados por la sucursal solicitante
 */
export function getPedidosPorSolicitante(
  sucursalId: string
) {
  return PedidoInternoModel.find({
    sucursalSolicitanteId: sucursalId,
  }).sort({ createdAt: -1 })
}

/**
 * Pedidos que debe abastecer la bodega (MAIN)
 */
export function getPedidosPorAbastecedora(
  sucursalId: string
) {
  return PedidoInternoModel.find({
    sucursalAbastecedoraId: sucursalId,
  }).sort({ createdAt: -1 })
}