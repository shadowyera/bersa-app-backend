import { Types } from 'mongoose'
import { StockSucursalModel } from '../stock/stock.model'
import {
  MovimientoModel,
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
} from './movimiento.model'

interface RegistrarMovimientoInput {
  tipoMovimiento: TIPO_MOVIMIENTO
  subtipoMovimiento: SUBTIPO_MOVIMIENTO

  productoId: Types.ObjectId
  sucursalId: Types.ObjectId

  /** Cantidad SIEMPRE positiva (unidad base) */
  cantidad: number

  referencia?: {
    tipo: REFERENCIA_MOVIMIENTO
    id: Types.ObjectId
  }

  observacion?: string
}

export const registrarMovimiento = async (
  input: RegistrarMovimientoInput
) => {
  const {
    tipoMovimiento,
    subtipoMovimiento,
    productoId,
    sucursalId,
    cantidad,
    referencia,
    observacion,
  } = input

  /* ================================
     1. Validaciones básicas
  ================================ */

  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0')
  }

  /* ================================
     2. Obtener stock actual
  ================================ */

  const stock = await StockSucursalModel.findOne({
    productoId,
    sucursalId,
  })

  if (!stock) {
    throw new Error(
      'No existe stock para este producto en la sucursal'
    )
  }

  /**
   * Regla 2026:
   * - Solo VENTA bloquea por habilitado
   * - Despachos internos, ajustes y compras NO
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

  const saldoAnterior = stock.cantidad

  /* ================================
     3. Calcular saldo posterior
  ================================ */

  const saldoPosterior =
    tipoMovimiento === TIPO_MOVIMIENTO.INGRESO
      ? saldoAnterior + cantidad
      : saldoAnterior - cantidad

  /* ================================
     4. Stock negativo permitido
  ================================ */

  if (saldoPosterior < 0) {
    console.warn(
      `[KARDEX] Stock negativo permitido | ` +
        `Producto=${productoId.toString()} | ` +
        `Sucursal=${sucursalId.toString()} | ` +
        `Anterior=${saldoAnterior} | ` +
        `Movimiento=${cantidad}`
    )
  }

  /* ================================
     5. Crear movimiento (Kardex)
  ================================ */

  await MovimientoModel.create({
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
  })

  /* ================================
     6. Actualizar stock derivado
  ================================ */

  stock.cantidad = saldoPosterior
  await stock.save()

  /* ================================
     7. Retorno útil
  ================================ */

  return {
    productoId,
    sucursalId,
    saldoAnterior,
    saldoPosterior,
    cantidad,
    tipoMovimiento,
    subtipoMovimiento,
    referencia,
  }
}