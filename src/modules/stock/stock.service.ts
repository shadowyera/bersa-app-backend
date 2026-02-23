import { Types } from 'mongoose'

import { StockSucursalModel } from './stock.model'
import SucursalModel from '../sucursal/sucursal.model'
import ProductoModel from '../producto/producto.model'

/* ======================================================
   TIPOS DE SALIDA
===================================================== */

export interface StockSucursalDTO {
  productoId: string
  cantidad: number
}

/* ======================================================
   INICIALIZADORES
===================================================== */

/**
 * Inicializa stock en 0 para un producto
 * en todas las sucursales activas
 */
export const inicializarStockPorProducto = async (
  productoId: Types.ObjectId
) => {
  const sucursales = await SucursalModel.find({ activo: true })
    .select('_id')
    .lean()

  const documentos = sucursales.map(sucursal => ({
    productoId,
    sucursalId: sucursal._id,
    cantidad: 0,
  }))

  if (!documentos.length) return

  await StockSucursalModel.insertMany(documentos, {
    ordered: false,
  })
}

/**
 * Inicializa stock en 0 para una sucursal
 * con todos los productos activos
 */
export const inicializarStockPorSucursal = async (
  sucursalId: Types.ObjectId
) => {
  const productos = await ProductoModel.find({ activo: true })
    .select('_id')
    .lean()

  const documentos = productos.map(producto => ({
    productoId: producto._id,
    sucursalId,
    cantidad: 0,
  }))

  if (!documentos.length) return

  await StockSucursalModel.insertMany(documentos, {
    ordered: false,
  })
}

/* ======================================================
   LECTURA STOCK (CLAVE PARA POS)
===================================================== */

/**
 * Obtiene stock vendible por sucursal
 * ❌ Sin populate
 * ✅ Normalizado
 */
export const obtenerStockPorSucursal = async (
  sucursalId: string
): Promise<StockSucursalDTO[]> => {
  const stocks = await StockSucursalModel.find({
    sucursalId: new Types.ObjectId(sucursalId),
    habilitado: true,
  })
    .select('productoId cantidad')
    .lean()

  return stocks.map(stock => ({
    productoId: stock.productoId.toString(),
    cantidad: stock.cantidad,
  }))
}

export const updateStockHabilitadoService = async (
  stockId: string,
  habilitado: boolean
) => {
  const stock = await StockSucursalModel.findById(stockId)

  if (!stock) return null

  stock.habilitado = habilitado
  await stock.save()

  return {
    id: stock._id.toString(),
    productoId: stock.productoId.toString(),
    sucursalId: stock.sucursalId.toString(),
    cantidad: stock.cantidad,
    habilitado: stock.habilitado,
  }
}