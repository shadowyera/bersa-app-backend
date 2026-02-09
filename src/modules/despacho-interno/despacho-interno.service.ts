import { Types } from 'mongoose'

/* =====================================================
   Models
===================================================== */
import { DespachoInternoModel } from './despacho-interno.model'
import {
  ESTADO_DESPACHO_INTERNO,
  ORIGEN_DESPACHO_INTERNO,
  ORIGEN_ITEM_DESPACHO,
} from './despacho-interno.types'

import { PedidoInternoModel } from '../pedido-interno/pedido-interno.model'
import { ESTADO_PEDIDO_INTERNO } from '../pedido-interno/pedido-interno.types'

/* =====================================================
   Kardex
===================================================== */
import { registrarMovimiento } from '../movimiento/movimiento.service'
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
} from '../movimiento/movimiento.model'

/* =====================================================
   INPUT TYPES
===================================================== */

interface ItemDirectoInput {
  productoId: string
  productoNombre: string
  cantidad: number
}

interface ItemSuplenteInput extends ItemDirectoInput {}

interface CrearDespachoDesdePedidoInput {
  origen: 'PEDIDO'
  pedidoIds: string[]
  sucursalOrigenId: string
  usuarioId: string
  itemsSuplentes?: ItemSuplenteInput[]
}

interface CrearDespachoDirectoInput {
  origen: 'DIRECTO'
  sucursalOrigenId: string
  sucursalDestinoId: string
  usuarioId: string
  items: ItemDirectoInput[]
}

type CrearDespachoInput =
  | CrearDespachoDesdePedidoInput
  | CrearDespachoDirectoInput

/* =====================================================
   SERVICE
===================================================== */

export async function crearDespachoInterno(
  input: CrearDespachoInput
) {
  /* ===================================================
     DESPACHO DESDE PEDIDO
  =================================================== */
  if (input.origen === 'PEDIDO') {
    const {
      pedidoIds,
      sucursalOrigenId,
      usuarioId,
      itemsSuplentes,
    } = input

    if (!pedidoIds || pedidoIds.length === 0) {
      throw new Error(
        'Debe seleccionar al menos un pedido'
      )
    }

    const pedidos = await PedidoInternoModel.find({
      _id: { $in: pedidoIds },
    })

    if (pedidos.length !== pedidoIds.length) {
      throw new Error(
        'Uno o más pedidos no existen'
      )
    }

    /* ---------- Validaciones ---------- */
    for (const pedido of pedidos) {
      if (
        pedido.estado !==
        ESTADO_PEDIDO_INTERNO.PREPARADO
      ) {
        throw new Error(
          `Pedido ${pedido._id.toString()} no está PREPARADO`
        )
      }

      if (
        pedido.sucursalAbastecedoraId.toString() !==
        sucursalOrigenId
      ) {
        throw new Error(
          'Sucursal origen no autorizada'
        )
      }
    }

    /* ---------- Items desde pedidos ---------- */
    const pedidosSnapshot = pedidos.map(pedido => {
      const itemsDesdePedido = pedido.items
        .map(item => {
          const cantidad =
            item.cantidadPreparada ?? 0

          if (cantidad <= 0) return null

          return {
            productoId: item.productoId,
            productoNombre: item.productoNombre,
            cantidad,
            origenItem:
              ORIGEN_ITEM_DESPACHO.PEDIDO,
          }
        })
        .filter(Boolean) as any[]

      return {
        pedidoInternoId: pedido._id,
        numeroPedido: pedido._id.toString(),
        sucursalDestinoId:
          pedido.sucursalSolicitanteId,
        items: itemsDesdePedido,
      }
    })

    /* ---------- Items suplentes ---------- */
    const suplentesSnapshot =
      itemsSuplentes?.map(item => ({
        productoId: new Types.ObjectId(
          item.productoId
        ),
        productoNombre: item.productoNombre,
        cantidad: item.cantidad,
        origenItem:
          ORIGEN_ITEM_DESPACHO.SUPLENTE,
      })) ?? []

    /* ---------- Mezclar suplentes ---------- */
    if (suplentesSnapshot.length > 0) {
      pedidosSnapshot[0].items.push(
        ...suplentesSnapshot
      )
    }

    /* ---------- Crear despacho ---------- */
    const despacho = await DespachoInternoModel.create({
      origen: ORIGEN_DESPACHO_INTERNO.PEDIDO,
      sucursalOrigenId: new Types.ObjectId(
        sucursalOrigenId
      ),
      pedidos: pedidosSnapshot,
      estado: ESTADO_DESPACHO_INTERNO.DESPACHADO,
      creadoPorId: new Types.ObjectId(usuarioId),
      creadoEn: new Date(),
      despachadoEn: new Date(),
    })

    /* ---------- Kardex ---------- */
    for (const pedido of pedidosSnapshot) {
      for (const item of pedido.items) {
        await registrarMovimiento({
          tipoMovimiento: TIPO_MOVIMIENTO.EGRESO,
          subtipoMovimiento:
            SUBTIPO_MOVIMIENTO.TRANSFERENCIA_ENVIO,

          productoId: item.productoId,
          sucursalId: new Types.ObjectId(
            sucursalOrigenId
          ),

          cantidad: item.cantidad,

          referencia: {
            tipo:
              REFERENCIA_MOVIMIENTO.DESPACHO_INTERNO,
            id: despacho._id,
          },

          observacion:
            item.origenItem ===
            ORIGEN_ITEM_DESPACHO.SUPLENTE
              ? 'Despacho suplente desde pedido'
              : 'Despacho desde pedido',
        })
      }
    }

    /* ---------- Cerrar pedidos ---------- */
    await PedidoInternoModel.updateMany(
      { _id: { $in: pedidoIds } },
      { estado: ESTADO_PEDIDO_INTERNO.DESPACHADO }
    )

    return despacho
  }

  /* ===================================================
     DESPACHO DIRECTO
  =================================================== */
  if (input.origen === 'DIRECTO') {
    const {
      sucursalOrigenId,
      sucursalDestinoId,
      usuarioId,
      items,
    } = input

    if (!items || items.length === 0) {
      throw new Error(
        'Despacho directo debe tener items'
      )
    }

    const itemsSnapshot = items.map(item => ({
      productoId: new Types.ObjectId(item.productoId),
      productoNombre: item.productoNombre,
      cantidad: item.cantidad,
      origenItem: ORIGEN_ITEM_DESPACHO.SUPLENTE,
    }))

    const despacho = await DespachoInternoModel.create({
      origen: ORIGEN_DESPACHO_INTERNO.DIRECTO,
      sucursalOrigenId: new Types.ObjectId(
        sucursalOrigenId
      ),
      itemsDirectos: itemsSnapshot,
      estado: ESTADO_DESPACHO_INTERNO.DESPACHADO,
      creadoPorId: new Types.ObjectId(usuarioId),
      creadoEn: new Date(),
      despachadoEn: new Date(),
    })

    /* ---------- Kardex ---------- */
    for (const item of itemsSnapshot) {
      await registrarMovimiento({
        tipoMovimiento: TIPO_MOVIMIENTO.EGRESO,
        subtipoMovimiento:
          SUBTIPO_MOVIMIENTO.TRANSFERENCIA_ENVIO,

        productoId: item.productoId,
        sucursalId: new Types.ObjectId(
          sucursalOrigenId
        ),

        cantidad: item.cantidad,

        referencia: {
          tipo:
            REFERENCIA_MOVIMIENTO.DESPACHO_INTERNO,
          id: despacho._id,
        },

        observacion: 'Despacho directo',
      })
    }

    return despacho
  }

  throw new Error('Origen de despacho inválido')
}