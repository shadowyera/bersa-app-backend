import { Types } from 'mongoose'
import { VentaModel } from './venta.model'
import { StockSucursalModel } from '../stock/stock.model'
import { registrarMovimiento } from '../movimiento/movimiento.service'
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
} from '../movimiento/movimiento.model'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../caja/aperturaCaja.model'
import { PagoModel } from '../pago/pago.model'
import { UsuarioModel } from '../usuario/usuario.model'

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
  ajusteRedondeo: number
}

/* ================================
   CREAR VENTA POS
================================ */

export const crearVentaPOS = async (input: CrearVentaInput) => {
  const {
    cajaId,
    aperturaCajaId,
    usuarioId,
    items,
    pagos,
    ajusteRedondeo,
  } = input

  if (!items.length) {
    throw new Error('La venta debe tener al menos un producto')
  }

  if (!pagos.length) {
    throw new Error('La venta debe tener al menos un pago')
  }

  /* ================================
     0. VALIDAR APERTURA DE CAJA
  ================================ */

  const apertura = await AperturaCajaModel.findOne({
    _id: aperturaCajaId,
    cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })

  if (!apertura) {
    throw new Error('La caja no está abierta')
  }

  const sucursalId = apertura.sucursalId

  let total = 0

  /* ================================
     1. VALIDAR PRODUCTOS + MARCAR QUIEBRES
  ================================ */

  const itemsProcesados = []

  for (const item of items) {
    const stock = await StockSucursalModel.findOne({
      productoId: item.productoId,
      sucursalId,
    })

    if (!stock) {
      throw new Error('Producto no existe en esta sucursal')
    }

    if (!stock.habilitado) {
      throw new Error(
        'Producto no habilitado para venta en esta sucursal'
      )
    }

    const subtotal = item.cantidad * item.precioUnitario

    const vendidoSinStock = stock.cantidad < item.cantidad

    total += subtotal

    itemsProcesados.push({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal,
      vendidoSinStock, // 🔥 CLAVE
    })
  }

  const totalCobrado = pagos.reduce(
    (sum, p) => sum + p.monto,
    0
  )

  /* ================================
     2. VALIDAR CUADRE DE CAJA
  ================================ */

  if (totalCobrado !== total + ajusteRedondeo) {
    throw new Error(
      `Pagos (${totalCobrado}) no coinciden con venta (${total}) + ajuste (${ajusteRedondeo})`
    )
  }

  /* ================================
     3. CREAR VENTA
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
    throw new Error('Error al crear la venta')
  }

  /* ================================
     4. REGISTRAR PAGOS
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
     5. KARDEX + STOCK
  ================================ */

  for (const item of itemsProcesados) {
    await registrarMovimiento({
      tipoMovimiento: TIPO_MOVIMIENTO.EGRESO,
      subtipoMovimiento: SUBTIPO_MOVIMIENTO.VENTA_POS,
      productoId: item.productoId,
      sucursalId,
      cantidad: item.cantidad,
      referencia: {
        tipo: 'VENTA',
        id: venta._id,
      },
      observacion: item.vendidoSinStock
        ? 'Venta realizada sin stock físico'
        : undefined,
    })
  }

  return venta
}
