import { Types } from 'mongoose'
import { VentaModel } from './venta.model'
import { StockSucursalModel } from '../stock/stock.model'
import { registrarMovimiento } from '../movimiento/movimiento.service'
import {
  REFERENCIA_MOVIMIENTO,
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
} from '../movimiento/movimiento.model'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../caja/aperturaCaja/aperturaCaja.model'
import { PagoModel } from '../pago/pago.model'

/* ================================
   HELPERS
================================ */

function calcularRedondeoCLP(total: number) {
  const resto = total % 10
  if (resto === 0) return 0
  return 10 - resto
}

/* ================================
   INPUTS
================================ */

interface CrearVentaItemInput {
  productoId: Types.ObjectId
  cantidad: number
  precioUnitario: number
}

interface PagoInput {
  tipo: string
  monto: number
}

interface CrearVentaInput {
  cajaId: Types.ObjectId
  aperturaCajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  items: CrearVentaItemInput[]
  pagos: PagoInput[]
}

/* ================================
   CREAR VENTA POS
================================ */

export const crearVentaPOS = async (
  input: CrearVentaInput
) => {

  const {
    cajaId,
    aperturaCajaId,
    usuarioId,
    items,
    pagos,
  } = input

  if (!items.length) {
    throw new Error(
      'La venta debe tener al menos un producto'
    )
  }

  if (!pagos.length) {
    throw new Error(
      'La venta debe tener al menos un pago'
    )
  }

  /* ================================
     0. VALIDAR APERTURA DE CAJA
  ================================ */

  const apertura =
    await AperturaCajaModel.findOne({
      _id: aperturaCajaId,
      cajaId,
      estado: ESTADO_APERTURA_CAJA.ABIERTA,
    })

  if (!apertura) {
    throw new Error('La caja no está abierta')
  }

  const sucursalId = apertura.sucursalId

  let total = 0
  const itemsProcesados = []

  /* ================================
     1. VALIDAR PRODUCTOS + SUBTOTAL
  ================================ */

  for (const item of items) {
    const stock =
      await StockSucursalModel.findOne({
        productoId: item.productoId,
        sucursalId,
      })

    if (!stock) {
      throw new Error(
        'Producto no existe en esta sucursal'
      )
    }

    if (!stock.habilitado) {
      throw new Error(
        'Producto no habilitado para venta'
      )
    }

    const subtotal =
      item.cantidad * item.precioUnitario

    total += subtotal

    itemsProcesados.push({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal,
    })
  }

  /* ================================
     2. DETERMINAR SI ES SOLO EFECTIVO
  ================================ */

  const soloEfectivo =
    pagos.length === 1 &&
    pagos[0].tipo?.toUpperCase() ===
      'EFECTIVO'

  /* ================================
     3. CALCULAR REDONDEO
  ================================ */

  const ajusteRedondeo = soloEfectivo
    ? calcularRedondeoCLP(total)
    : 0

  const totalCobrado = soloEfectivo
    ? total + ajusteRedondeo
    : total

  /* ================================
     4. VALIDAR CUADRE
  ================================ */

  const sumaPagos = pagos.reduce(
    (sum, p) => sum + p.monto,
    0
  )

  if (soloEfectivo) {
    if (sumaPagos !== total) {
      throw new Error(
        `Pagos (${sumaPagos}) no coinciden con total (${total})`
      )
    }
  } else {
    if (sumaPagos !== totalCobrado) {
      throw new Error(
        `Pagos (${sumaPagos}) no coinciden con total (${totalCobrado})`
      )
    }
  }

  /* ================================
     5. CREAR VENTA
  ================================ */

  const venta = await VentaModel.create({
    sucursalId,
    cajaId,
    aperturaCajaId,
    usuarioId,
    items: itemsProcesados,
    total,
    ajusteRedondeo,
    totalCobrado,
    estado: 'FINALIZADA',
  })

  if (!venta) {
    throw new Error('Error al crear venta')
  }

  /* ================================
     6. REGISTRAR PAGOS
  ================================ */

  for (const pago of pagos) {
    await PagoModel.create({
      ventaId: venta._id,
      aperturaCajaId,
      sucursalId,
      tipo: pago.tipo,
      monto: pago.monto,
    })
  }

  /* ================================
     7. KARDEX
  ================================ */

  for (const item of itemsProcesados) {
    await registrarMovimiento({
      tipoMovimiento: TIPO_MOVIMIENTO.EGRESO,
      subtipoMovimiento:
        SUBTIPO_MOVIMIENTO.VENTA_POS,
      productoId: item.productoId,
      sucursalId,
      cantidad: item.cantidad,
      referencia: {
        tipo: REFERENCIA_MOVIMIENTO.VENTA,
        id: venta._id,
      },
    })
  }

  return venta
}