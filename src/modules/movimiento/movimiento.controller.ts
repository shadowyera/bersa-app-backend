import { Request, Response } from 'express'
import { Types } from 'mongoose'

import { registrarMovimiento } from './movimiento.service'
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
  MovimientoModel,
} from './movimiento.model'

/* =====================================================
   POST /api/movimientos
   Registrar movimiento de Kardex
===================================================== */
export const createMovimiento = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      tipoMovimiento,
      subtipoMovimiento,
      productoId,
      sucursalId,
      cantidad,
      referencia,
      observacion,
    } = req.body

    /* ================================
       Validaciones básicas de input
    ================================ */

    if (
      !tipoMovimiento ||
      !subtipoMovimiento ||
      !productoId ||
      !sucursalId ||
      cantidad === undefined
    ) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios',
      })
    }

    if (!Object.values(TIPO_MOVIMIENTO).includes(tipoMovimiento)) {
      return res.status(400).json({
        message: 'tipoMovimiento inválido',
      })
    }

    if (!Object.values(SUBTIPO_MOVIMIENTO).includes(subtipoMovimiento)) {
      return res.status(400).json({
        message: 'subtipoMovimiento inválido',
      })
    }

    if (!Types.ObjectId.isValid(productoId)) {
      return res.status(400).json({
        message: 'productoId inválido',
      })
    }

    if (!Types.ObjectId.isValid(sucursalId)) {
      return res.status(400).json({
        message: 'sucursalId inválido',
      })
    }

    if (typeof cantidad !== 'number' || cantidad <= 0) {
      return res.status(400).json({
        message: 'cantidad inválida',
      })
    }

    if (referencia) {
      if (
        !Object.values(REFERENCIA_MOVIMIENTO).includes(
          referencia.tipo
        )
      ) {
        return res.status(400).json({
          message: 'referencia.tipo inválido',
        })
      }

      if (!Types.ObjectId.isValid(referencia.id)) {
        return res.status(400).json({
          message: 'referencia.id inválido',
        })
      }
    }

    /* ================================
       Llamada al service (dominio)
    ================================ */

    const resultado = await registrarMovimiento({
      tipoMovimiento,
      subtipoMovimiento,
      productoId: new Types.ObjectId(productoId),
      sucursalId: new Types.ObjectId(sucursalId),
      cantidad,
      referencia: referencia
        ? {
            tipo: referencia.tipo,
            id: new Types.ObjectId(referencia.id),
          }
        : undefined,
      observacion,
    })

    /* ================================
       Respuesta OK
    ================================ */

    return res.status(201).json({
      message: 'Movimiento registrado correctamente',
      data: resultado,
    })
  } catch (error: any) {
    return res.status(400).json({
      message:
        error?.message ??
        'Error al registrar movimiento',
    })
  }
}

/* =====================================================
   GET /api/movimientos
   Listar movimientos (Kardex)
===================================================== */
export const getMovimientos = async (
  req: Request,
  res: Response
) => {
  try {
    const filter: any = {}

    // filtros por params
    if (req.params.productoId) {
      filter.productoId = req.params.productoId
    }

    if (req.params.sucursalId) {
      filter.sucursalId = req.params.sucursalId
    }

    // paginación
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 10)
    const skip = (page - 1) * limit

    const [movimientos, total] =
      await Promise.all([
        MovimientoModel.find(filter)
          .sort({ fecha: -1 }) // más nuevo primero
          .skip(skip)
          .limit(limit),

        MovimientoModel.countDocuments(filter),
      ])

    return res.json({
      data: movimientos,
      total,
      page,
      limit,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener movimientos',
    })
  }
}