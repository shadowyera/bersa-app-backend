import { Types } from 'mongoose'
import { StockSucursalModel } from '../stock/stock.model'
import {
  MovimientoModel,
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
} from './movimiento.model'

interface RegistrarMovimientoInput {
  tipoMovimiento: TIPO_MOVIMIENTO
  subtipoMovimiento: SUBTIPO_MOVIMIENTO

  productoId: Types.ObjectId
  sucursalId: Types.ObjectId

  cantidad: number

  referencia?: {
    tipo: 'VENTA' | 'TRANSFERENCIA' | 'AJUSTE' | 'COMPRA'
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

  // 🚫 Este sí se mantiene: no se puede vender si está deshabilitado
  if (
    tipoMovimiento === TIPO_MOVIMIENTO.EGRESO &&
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
     4. PERMITIR stock negativo
  ================================ */

  if (saldoPosterior < 0) {
    console.warn(
      `Stock negativo permitido. Producto=${productoId.toString()} ` +
      `Sucursal=${sucursalId.toString()} ` +
      `Anterior=${saldoAnterior} ` +
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
     6. Actualizar stock
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
  }
}