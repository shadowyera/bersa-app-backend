import mongoose, {
  Types,
  ClientSession,
} from 'mongoose'

import { StockSucursalModel } from '../stock/stock.model'
import {
  MovimientoModel,
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
} from './movimiento.model'

/* =====================================================
   INPUT
===================================================== */

interface RegistrarMovimientoInput {
  tipoMovimiento: TIPO_MOVIMIENTO
  subtipoMovimiento: SUBTIPO_MOVIMIENTO

  productoId: Types.ObjectId
  sucursalId: Types.ObjectId

  /** Cantidad SIEMPRE positiva */
  cantidad: number

  referencia?: {
    tipo: REFERENCIA_MOVIMIENTO
    id: Types.ObjectId
  }

  observacion?: string
}

/* =====================================================
   REGISTRAR MOVIMIENTO (TRANSACCIONAL)
===================================================== */

export const registrarMovimiento = async (
  input: RegistrarMovimientoInput,
  session?: ClientSession
) => {

  const externalSession = session
  const localSession =
    externalSession ?? await mongoose.startSession()

  try {

    if (!externalSession) {
      localSession.startTransaction()
    }

    const {
      tipoMovimiento,
      subtipoMovimiento,
      productoId,
      sucursalId,
      cantidad,
      referencia,
      observacion,
    } = input

    /* ============================
       VALIDACIONES
    ============================ */

    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0')
    }

    /* ============================
       OBTENER STOCK
    ============================ */

    const stock = await StockSucursalModel
      .findOne(
        { productoId, sucursalId },
        null,
        { session: localSession }
      )
      .lean()

    if (!stock) {
      throw new Error(
        'No existe stock para este producto en la sucursal'
      )
    }

    /**
     * Solo VENTA bloquea por habilitado
     */
    if (
      tipoMovimiento === TIPO_MOVIMIENTO.EGRESO &&
      subtipoMovimiento === SUBTIPO_MOVIMIENTO.VENTA_POS &&
      !stock.habilitado
    ) {
      throw new Error(
        'Producto no habilitado para venta en esta sucursal'
      )
    }

    /* ============================
       CÁLCULO SALDOS
    ============================ */

    const saldoAnterior = stock.cantidad

    const delta =
      tipoMovimiento === TIPO_MOVIMIENTO.INGRESO
        ? cantidad
        : -cantidad

    const saldoPosterior = saldoAnterior + delta

    if (saldoPosterior < 0) {
      console.warn(
        `[KARDEX] Stock negativo permitido | ` +
          `Producto=${productoId.toString()} | ` +
          `Sucursal=${sucursalId.toString()} | ` +
          `Anterior=${saldoAnterior} | ` +
          `Movimiento=${cantidad}`
      )
    }

    /* ============================
       UPDATE STOCK ATÓMICO
    ============================ */

    await StockSucursalModel.updateOne(
      { _id: stock._id },
      { $inc: { cantidad: delta } },
      { session: localSession }
    )

    /* ============================
       CREAR MOVIMIENTO
    ============================ */

    const movimiento = await MovimientoModel.create(
      [
        {
          tipoMovimiento,
          subtipoMovimiento,
          productoId,
          sucursalId,
          cantidad,
          saldoAnterior,
          saldoPosterior,
          referencia,
          observacion,
          fecha: new Date(),
        },
      ],
      { session: localSession }
    )

    /* ============================
       COMMIT
    ============================ */

    if (!externalSession) {
      await localSession.commitTransaction()
      localSession.endSession()
    }

    return movimiento[0]

  } catch (error) {

    if (!externalSession) {
      await localSession.abortTransaction()
      localSession.endSession()
    }

    throw error
  }
}