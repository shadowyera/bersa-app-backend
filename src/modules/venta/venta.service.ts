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
import { generarNumeroVenta } from './contador/generarNumeroVenta'

/* =====================================================
   UTILIDADES
===================================================== */

function calcularRedondeoCLP(total: number) {
  const resto = total % 10
  if (resto === 0) return 0
  return 10 - resto
}

/* =====================================================
   INPUTS
===================================================== */

interface CrearVentaItemInput {
  productoId: Types.ObjectId
  cantidad: number
  precioUnitario: number
}

interface PagoInput {
  tipo: string
  monto: number
}

interface DocumentoReceptorInput {
  rut: string
  razonSocial: string
  giro: string
  direccion: string
  comuna: string
  ciudad: string
}

interface DocumentoTributarioInput {
  tipo: 'BOLETA' | 'FACTURA'
  receptor?: DocumentoReceptorInput
  requiereEmisionSii?: boolean
}

interface CrearVentaInput {
  cajaId: Types.ObjectId
  aperturaCajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  items: CrearVentaItemInput[]
  pagos: PagoInput[]
  documentoTributario: DocumentoTributarioInput
}

/* =====================================================
   CREAR VENTA POS
===================================================== */

export const crearVentaPOS = async (
  input: CrearVentaInput
) => {

  const {
    cajaId,
    aperturaCajaId,
    usuarioId,
    items,
    pagos,
    documentoTributario,
  } = input

  /* ================= VALIDACIONES BÁSICAS ================= */

  if (!items.length) {
    throw new Error('La venta debe tener al menos un producto')
  }

  if (!pagos.length) {
    throw new Error('La venta debe tener al menos un pago')
  }

  if (!documentoTributario?.tipo) {
    throw new Error('Debe especificar el tipo de documento')
  }

  if (
    documentoTributario.tipo === 'FACTURA' &&
    !documentoTributario.receptor
  ) {
    throw new Error('Factura requiere datos del receptor')
  }

  /* ================= VALIDAR CAJA ABIERTA ================= */

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

  /* ================= PROCESAR ITEMS ================= */

  let total = 0
  const itemsProcesados: any[] = []

  for (const item of items) {

    const stock =
      await StockSucursalModel.findOne({
        productoId: item.productoId,
        sucursalId,
      })

    if (!stock) {
      throw new Error('Producto no existe en esta sucursal')
    }

    if (!stock.habilitado) {
      throw new Error('Producto no habilitado para venta')
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

  /* ================= REDONDEO CLP ================= */

  const soloEfectivo =
    pagos.length === 1 &&
    pagos[0].tipo?.toUpperCase() === 'EFECTIVO'

  const ajusteRedondeo = soloEfectivo
    ? calcularRedondeoCLP(total)
    : 0

  const totalCobrado = soloEfectivo
    ? total + ajusteRedondeo
    : total

  const sumaPagos = pagos.reduce(
    (sum, p) => sum + p.monto,
    0
  )

  if (soloEfectivo && sumaPagos !== total) {
    throw new Error(
      `Pagos (${sumaPagos}) no coinciden con total (${total})`
    )
  }

  if (!soloEfectivo && sumaPagos !== totalCobrado) {
    throw new Error(
      `Pagos (${sumaPagos}) no coinciden con total (${totalCobrado})`
    )
  }

  /* ================= NUMERACIÓN ================= */

  const numeroVenta =
    await generarNumeroVenta(
      aperturaCajaId
    )

  /* ================= DOCUMENTO TRIBUTARIO SNAPSHOT ================= */

  const documentoFinal = {
    tipo: documentoTributario.tipo,
    receptor:
      documentoTributario.tipo === 'FACTURA'
        ? {
            rut: documentoTributario.receptor!.rut,
            razonSocial:
              documentoTributario.receptor!.razonSocial,
            giro: documentoTributario.receptor!.giro,
            direccion:
              documentoTributario.receptor!.direccion,
            comuna:
              documentoTributario.receptor!.comuna,
            ciudad:
              documentoTributario.receptor!.ciudad,
          }
        : undefined,
    requiereEmisionSii:
      documentoTributario.tipo === 'FACTURA'
        ? true
        : false,
  }

  /* ================= CREAR VENTA ================= */

  const venta = await VentaModel.create({
    sucursalId,
    cajaId,
    aperturaCajaId,
    usuarioId,
    numeroVenta,
    items: itemsProcesados,
    total,
    ajusteRedondeo,
    totalCobrado,
    estado: 'FINALIZADA',
    documentoTributario: documentoFinal,
  })

  /* ================= CREAR PAGOS ================= */

  for (const pago of pagos) {
    await PagoModel.create({
      ventaId: venta._id,
      aperturaCajaId,
      sucursalId,
      tipo: pago.tipo,
      monto: pago.monto,
    })
  }

  /* ================= DESCONTAR STOCK ================= */

  for (const item of itemsProcesados) {
    await registrarMovimiento({
      tipoMovimiento: TIPO_MOVIMIENTO.EGRESO,
      subtipoMovimiento: SUBTIPO_MOVIMIENTO.VENTA_POS,
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

/* =====================================================
   ANULAR VENTA
===================================================== */

export const anularVentaPOS = async (
  ventaId: Types.ObjectId
) => {

  const venta = await VentaModel.findById(ventaId)

  if (!venta) throw new Error('Venta no existe')
  if (venta.estado === 'ANULADA')
    throw new Error('La venta ya está anulada')
  if (venta.estado !== 'FINALIZADA')
    throw new Error('Solo se pueden anular ventas finalizadas')

  for (const item of venta.items) {
    await registrarMovimiento({
      tipoMovimiento: TIPO_MOVIMIENTO.INGRESO,
      subtipoMovimiento:
        SUBTIPO_MOVIMIENTO.ANULACION_VENTA_POS,
      productoId: item.productoId,
      sucursalId: venta.sucursalId,
      cantidad: item.cantidad,
      referencia: {
        tipo: REFERENCIA_MOVIMIENTO.ANULACION,
        id: venta._id,
      },
      observacion: `Anulación venta N° ${venta.numeroVenta}`,
    })
  }

  venta.estado = 'ANULADA'
  await venta.save()

  return {
    ventaId: venta._id,
    numeroVenta: venta.numeroVenta,
    estado: venta.estado,
  }
}

/* =====================================================
   DETALLE VENTA
===================================================== */

export const obtenerVentaDetalle = async (
  ventaId: Types.ObjectId
) => {

  const venta = await VentaModel.findById(ventaId)
    .populate('items.productoId', 'nombre')
    .lean()

  if (!venta) {
    throw new Error('Venta no encontrada')
  }

  const pagos = await PagoModel.find({
    ventaId,
  }).lean()

  return {
    _id: venta._id,
    numeroVenta: venta.numeroVenta,

    documentoTributario: venta.documentoTributario,

    total: venta.total,
    ajusteRedondeo: venta.ajusteRedondeo,
    totalCobrado: venta.totalCobrado,
    createdAt: venta.createdAt,

    items: venta.items.map((i: any) => ({
      productoId: i.productoId._id,
      nombre: i.productoId.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: i.subtotal,
    })),

    pagos: pagos.map(p => ({
      tipo: p.tipo,
      monto: p.monto,
    })),
  }
}

/* =====================================================
   LISTAR VENTAS (ADMIN)
===================================================== */

interface ListarVentasAdminInput {
  from?: Date
  to?: Date
  sucursalId?: Types.ObjectId
  cajaId?: Types.ObjectId
  usuarioId?: Types.ObjectId
  estado?: 'FINALIZADA' | 'ANULADA'
  tipoDocumento?: 'BOLETA' | 'FACTURA'
}

export const listarVentasAdmin = async (
  filtros: ListarVentasAdminInput
) => {

  const query: any = {}

  if (filtros.from || filtros.to) {
    query.createdAt = {}
    if (filtros.from) query.createdAt.$gte = filtros.from
    if (filtros.to) query.createdAt.$lte = filtros.to
  }

  if (filtros.sucursalId)
    query.sucursalId = filtros.sucursalId

  if (filtros.cajaId)
    query.cajaId = filtros.cajaId

  if (filtros.usuarioId)
    query.usuarioId = filtros.usuarioId

  if (filtros.estado)
    query.estado = filtros.estado

  if (filtros.tipoDocumento)
    query['documentoTributario.tipo'] =
      filtros.tipoDocumento

  const ventas = await VentaModel.find(query)
    .sort({ createdAt: -1 })
    .lean()

  return ventas.map(v => ({
    _id: v._id,
    numeroVenta: v.numeroVenta,
    total: v.total,
    totalCobrado: v.totalCobrado,
    estado: v.estado,
    documentoTributario: v.documentoTributario,
    usuarioId: v.usuarioId,
    cajaId: v.cajaId,
    sucursalId: v.sucursalId,
    createdAt: v.createdAt,
  }))
}