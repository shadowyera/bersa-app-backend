import { Request, Response } from 'express'

import {
  editarPedidoInterno,
  cancelarPedidoInterno,
  getPedidosPorSolicitante,
  getPedidosPorAbastecedora,
} from './pedido-interno.service'

import {
  crearPedidoInternoUsecase,
} from './crearPedidoInterno.usecase'

import {
  prepararPedidoInternoUsecase,
} from './preparacion/prepararPedidoInterno.usecase'

import {
  serializePedidoInterno,
  serializePedidosInternos,
} from './pedido-interno.serializer'

/* =====================================================
   Crear pedido interno
   -----------------------------------------------------
   - Sucursal DESTINO crea pedido
   - Estado inicial: CREADO
   - Emite PEDIDO_CREATED (realtime)
===================================================== */
export async function crearPedido(
  req: Request,
  res: Response
) {
  try {
    const { sucursalAbastecedoraId, items } = req.body

    if (!sucursalAbastecedoraId) {
      return res.status(400).json({
        message: 'Sucursal abastecedora es requerida',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          'El pedido debe contener al menos un item',
      })
    }

    const pedido = await crearPedidoInternoUsecase({
      sucursalSolicitanteId: req.user!.sucursalId,
      sucursalAbastecedoraId,
      items,
      usuarioId: req.user!._id,
    })

    return res
      .status(201)
      .json(serializePedidoInterno(pedido))
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al crear pedido interno',
    })
  }
}

/* =====================================================
   Editar pedido interno
===================================================== */
export async function editarPedido(
  req: Request,
  res: Response
) {
  try {
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          'El pedido debe contener al menos un item',
      })
    }

    const pedido = await editarPedidoInterno(
      req.params.id,
      req.user!.sucursalId,
      items
    )

    return res.json(
      serializePedidoInterno(pedido)
    )
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al editar pedido interno',
    })
  }
}

/* =====================================================
   Cancelar pedido interno
===================================================== */
export async function cancelarPedido(
  req: Request,
  res: Response
) {
  try {
    const pedido = await cancelarPedidoInterno(
      req.params.id,
      req.user!.sucursalId
    )

    return res.json(
      serializePedidoInterno(pedido)
    )
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al cancelar pedido interno',
    })
  }
}

/* =====================================================
   Listar pedidos creados por mi sucursal
===================================================== */
export async function listarPedidosPropios(
  req: Request,
  res: Response
) {
  try {
    const pedidos = await getPedidosPorSolicitante(
      req.user!.sucursalId
    )

    return res.json(
      serializePedidosInternos(pedidos)
    )
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al listar pedidos propios',
    })
  }
}

/* =====================================================
   Listar pedidos que debo abastecer
===================================================== */
export async function listarPedidosRecibidos(
  req: Request,
  res: Response
) {
  try {
    const pedidos = await getPedidosPorAbastecedora(
      req.user!.sucursalId
    )

    return res.json(
      serializePedidosInternos(pedidos)
    )
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al listar pedidos recibidos',
    })
  }
}

/* =====================================================
   Preparar pedido interno
===================================================== */
export async function prepararPedido(
  req: Request,
  res: Response
) {
  try {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({
        message: 'Items a preparar inválidos',
      })
    }

    const pedido = await prepararPedidoInternoUsecase({
      pedidoId: req.params.id,
      itemsPreparados: items,
      sucursalAbastecedoraId: req.user!.sucursalId,
      usuarioId: req.user!._id,
    })

    return res.json(
      serializePedidoInterno(pedido)
    )
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al preparar pedido',
    })
  }
}