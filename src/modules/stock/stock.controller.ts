// src/modules/stock/stock.controller.ts

import { Request, Response } from 'express'
import { Types } from 'mongoose'

import {
  obtenerStockAdminService,
  obtenerStockPorSucursal,
  updateStockHabilitadoService,
} from './stock.service'

/* ======================================================
   GET /api/stock/sucursal/:sucursalId
   → Endpoint liviano para POS
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

    const stock = await obtenerStockPorSucursal(sucursalId)

    return res.json(stock)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener stock por sucursal',
    })
  }
}

/* ======================================================
   PUT /api/stock/:stockId/habilitado
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

    const updated = await updateStockHabilitadoService(
      stockId,
      habilitado
    )

    if (!updated) {
      return res.status(404).json({
        message: 'Stock no encontrado',
      })
    }

    return res.json({
      message: `Producto ${habilitado ? 'habilitado' : 'deshabilitado'
        } en la sucursal`,
      data: updated,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al actualizar estado del producto',
    })
  }
}

/* ======================================================
   GET /api/admin/stock?sucursalId=xxx
===================================================== */

export const getAdminStock = async (
  req: Request,
  res: Response
) => {
  try {
    const { sucursalId } = req.query

    if (!sucursalId || !Types.ObjectId.isValid(String(sucursalId))) {
      return res.status(400).json({
        message: 'sucursalId inválido',
      })
    }

    const stock = await obtenerStockAdminService(
      String(sucursalId)
    )

    return res.json(stock)
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener stock admin',
    })
  }
}