import mongoose, { Types } from 'mongoose'
import { StockSucursalModel } from './stock.model'
import SucursalModel from '../sucursal/sucursal.model'
import ProductoModel from '../producto/producto.model'
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
} from '../movimiento/movimiento.model'
import { registrarMovimiento } from '../movimiento/movimiento.service'

/* ======================================================
   DTOs
===================================================== */

export interface StockSucursalDTO {
  productoId: string
  cantidad: number
}

export interface AdminStockDTO {
  stockId: string
  productoId: string
  nombreProducto: string

  proveedorId?: string
  proveedorNombre?: string

  cantidad: number
  habilitado: boolean
}

/* ======================================================
   TIPOS INTERNOS PARA LEAN + POPULATE
===================================================== */

interface StockPopulateLean {
  _id?: Types.ObjectId
  cantidad?: number
  habilitado?: boolean
  productoId?: {
    _id?: Types.ObjectId
    nombre?: string
    proveedorId?: {
      _id?: Types.ObjectId
      nombre?: string
    } | null
  } | null
}

interface AjusteStockInput {
  stockId: string
  cantidad: number
  motivo: string
  usuarioId: Types.ObjectId
}

/* ======================================================
   INICIALIZADORES
===================================================== */

export const inicializarStockPorProducto = async (
  productoId: Types.ObjectId
) => {
  const sucursales = await SucursalModel.find({ activo: true })
    .select('_id')
    .lean()

  if (!sucursales.length) return

  const documentos = sucursales.map((sucursal) => ({
    productoId,
    sucursalId: sucursal._id,
    cantidad: 0,
  }))

  await StockSucursalModel.insertMany(documentos, {
    ordered: false,
  })
}

export const inicializarStockPorSucursal = async (
  sucursalId: Types.ObjectId
) => {
  const productos = await ProductoModel.find({ activo: true })
    .select('_id')
    .lean()

  if (!productos.length) return

  const documentos = productos.map((producto) => ({
    productoId: producto._id,
    sucursalId,
    cantidad: 0,
  }))

  await StockSucursalModel.insertMany(documentos, {
    ordered: false,
  })
}

/* ======================================================
   POS STOCK (liviano, sin populate)
===================================================== */

export const obtenerStockPorSucursal = async (
  sucursalId: string
): Promise<StockSucursalDTO[]> => {
  const stocks = await StockSucursalModel.find({
    sucursalId: new Types.ObjectId(sucursalId),
    habilitado: true,
  })
    .select('productoId cantidad')
    .lean()

  return stocks.map((stock) => ({
    productoId: stock.productoId.toString(),
    cantidad: stock.cantidad,
  }))
}

/* ======================================================
   UPDATE HABILITADO
===================================================== */

export const updateStockHabilitadoService = async (
  stockId: string,
  habilitado: boolean
): Promise<AdminStockDTO | null> => {
  const stock = await StockSucursalModel.findById(stockId)

  if (!stock) return null

  stock.habilitado = habilitado
  await stock.save()

  const producto = await ProductoModel.findById(
    stock.productoId
  ).select('nombre')

  return {
    stockId: stock._id.toString(),
    productoId: stock.productoId.toString(),
    nombreProducto: producto?.nombre ?? 'Producto eliminado',
    cantidad: stock.cantidad,
    habilitado: stock.habilitado,
  }
}

/* ======================================================
   ADMIN STOCK
===================================================== */

export const obtenerStockAdminService = async (
  sucursalId: string
): Promise<AdminStockDTO[]> => {
  const stocks = await StockSucursalModel.find({
    sucursalId: new Types.ObjectId(sucursalId),
  })
    .populate({
      path: 'productoId',
      select: 'nombre proveedorId',
      populate: {
        path: 'proveedorId',
        select: 'nombre',
      },
    })
    .lean<StockPopulateLean[]>()
  return stocks
    .filter((stock) => {
      if (!stock?._id) return false
      if (!stock.productoId?._id) return false
      if (typeof stock.cantidad !== 'number') return false
      return true
    })
    .map((stock) => ({
      stockId: stock._id!.toString(),
      productoId: stock.productoId!._id!.toString(),
      nombreProducto: stock.productoId!.nombre ?? 'Producto sin nombre',

      proveedorId: stock.productoId!.proveedorId?._id?.toString(),
      proveedorNombre: stock.productoId!.proveedorId?.nombre,

      cantidad: stock.cantidad!,
      habilitado: Boolean(stock.habilitado),
    }))

}

export const ajustarStockAdminService = async (
  input: AjusteStockInput
) => {

  const session = await mongoose.startSession()

  try {
    session.startTransaction()

    const { stockId, cantidad, motivo, usuarioId } = input

    if (!motivo || motivo.trim().length < 3) {
      throw new Error('Debe especificar un motivo válido')
    }

    if (cantidad === 0) {
      throw new Error('La cantidad no puede ser 0')
    }

    const stock = await StockSucursalModel.findById(
      stockId,
      null,
      { session }
    )

    if (!stock) {
      throw new Error('Stock no encontrado')
    }

    const tipoMovimiento =
      cantidad > 0
        ? TIPO_MOVIMIENTO.INGRESO
        : TIPO_MOVIMIENTO.EGRESO

    await registrarMovimiento(
      {
        tipoMovimiento,
        subtipoMovimiento: SUBTIPO_MOVIMIENTO.AJUSTE_ADMIN,
        productoId: stock.productoId,
        sucursalId: stock.sucursalId,
        cantidad: Math.abs(cantidad),
        referencia: {
          tipo: REFERENCIA_MOVIMIENTO.AJUSTE,
          id: usuarioId,
        },
        observacion: motivo,
      },
      session
    )

    await session.commitTransaction()
    session.endSession()

    return {
      stockId,
      ajuste: cantidad,
      motivo,
    }

  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}