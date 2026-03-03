import { Request, Response } from 'express'
import { Types } from 'mongoose'

import {
  ajustarStockAdminService,
  obtenerStockAdminService,
  obtenerStockPorSucursal,
  updateStockHabilitadoService,
} from './stock.service'

/* ======================================================
   POS
===================================================== */

export const getStockBySucursal = async (
  req: Request,
  res: Response
) => {
  try {
    const { sucursalId } = req.params

    if (!Types.ObjectId.isValid(sucursalId)) {
      return res.status(400).json({
        message: 'sucursalId inválido',
      })
    }

    const stock =
      await obtenerStockPorSucursal(sucursalId)

    return res.json(stock)

  } catch (error) {
    console.error('[POS STOCK ERROR]', error)

    return res.status(500).json({
      message: 'Error al obtener stock por sucursal',
    })
  }
}

/* ======================================================
   UPDATE HABILITADO
===================================================== */

export const updateStockHabilitado = async (
  req: Request,
  res: Response
) => {
  try {
    const { stockId } = req.params
    const { habilitado } = req.body

    if (!Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({
        message: 'stockId inválido',
      })
    }

    if (typeof habilitado !== 'boolean') {
      return res.status(400).json({
        message: 'El campo habilitado debe ser boolean',
      })
    }

    const updated =
      await updateStockHabilitadoService(
        stockId,
        habilitado
      )

    if (!updated) {
      return res.status(404).json({
        message: 'Stock no encontrado',
      })
    }

    return res.json(updated)

  } catch (error) {
    console.error('[UPDATE STOCK ERROR]', error)

    return res.status(500).json({
      message: 'Error al actualizar estado del producto',
    })
  }
}

/* ======================================================
   ADMIN - SIN PAGINACIÓN BACKEND
===================================================== */

export const getAdminStock = async (
  req: Request,
  res: Response
) => {
  try {
    const { sucursalId } = req.query

    if (
      !sucursalId ||
      typeof sucursalId !== 'string' ||
      !Types.ObjectId.isValid(sucursalId)
    ) {
      return res.status(400).json({
        message: 'sucursalId inválido',
      })
    }

    const result =
      await obtenerStockAdminService({
        sucursalId,
      })

    return res.json(result)

  } catch (error) {
    console.error('[ADMIN STOCK ERROR]', error)

    return res.status(500).json({
      message: 'Error al obtener stock admin',
    })
  }
}

/* ======================================================
   AJUSTE ADMIN
===================================================== */

export const ajustarStockAdmin = async (
  req: Request,
  res: Response
) => {
  try {
    const { stockId } = req.params
    const { cantidad, motivo } = req.body

    if (!Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({
        message: 'stockId inválido',
      })
    }

    const usuarioId = req.user?._id

    if (!usuarioId) {
      return res.status(401).json({
        message: 'No autorizado',
      })
    }

    const result =
      await ajustarStockAdminService({
        stockId,
        cantidad: Number(cantidad),
        motivo,
        usuarioId: new Types.ObjectId(usuarioId),
      })

    return res.json(result)

  } catch (error) {
    console.error('[AJUSTE STOCK ERROR]', error)

    return res.status(500).json({
      message: 'Error al ajustar stock',
    })
  }
}