import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  registrarMovimiento,
} from './movimiento.service';
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  MovimientoModel,
} from './movimiento.model';

/**
 * POST /api/movimientos
 * Registra un movimiento de inventario (Kardex)
 */
export const createMovimiento = async (req: Request, res: Response) => {
  try {
    const {
      tipoMovimiento,
      subtipoMovimiento,
      productoId,
      sucursalId,
      cantidad,
      referencia,
      observacion,
    } = req.body;

    // ================================
    // Validaciones mínimas de entrada
    // ================================

    if (
      !tipoMovimiento ||
      !subtipoMovimiento ||
      !productoId ||
      !sucursalId ||
      !cantidad
    ) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios',
      });
    }

    // ================================
    // Llamada al service (lógica real)
    // ================================

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
    });

    // ================================
    // Respuesta OK
    // ================================

    return res.status(201).json({
      message: 'Movimiento registrado correctamente',
      data: resultado,
    });
  } catch (error: any) {
    // ================================
    // Manejo de errores controlado
    // ================================

    return res.status(400).json({
      message: error.message || 'Error al registrar movimiento',
    });
  }
};

export const getMovimientos = async (req: Request, res: Response) => {
  try {
    const filter: any = {}

    // filtros
    if (req.params.productoId) {
      filter.productoId = req.params.productoId
    }

    if (req.params.sucursalId) {
      filter.sucursalId = req.params.sucursalId
    }

    // query params
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 10)
    const skip = (page - 1) * limit

    // query principal
    const [movimientos, total] = await Promise.all([
      MovimientoModel.find(filter)
        .sort({ fecha: -1 }) // 👈 MÁS NUEVO PRIMERO
        .skip(skip)
        .limit(limit),

      MovimientoModel.countDocuments(filter),
    ])

    res.json({
      data: movimientos,
      total,
      page,
      limit,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener movimientos',
    })
  }
}