import { Types } from 'mongoose'
import { StockSucursalModel } from './stock.model'

/* =====================================================
   Stock para preparación de pedidos (BATCH)
   - Convierte a unidad pedida
   - Respeta habilitado
===================================================== */

export async function getStockPreparacionPorProductos(
  sucursalId: string,
  items: {
    productoId: string
    factorUnidad: number
  }[]
): Promise<
  Record<
    string,
    {
      stockDisponible: number
      habilitado: boolean
    }
  >
> {
  if (items.length === 0) return {}

  const productoIds = items.map(i =>
    new Types.ObjectId(i.productoId)
  )

  const stocks = await StockSucursalModel.find({
    sucursalId: new Types.ObjectId(sucursalId),
    productoId: { $in: productoIds },
  }).lean()

  const stockMap: Record<
    string,
    { stockDisponible: number; habilitado: boolean }
  > = {}

  for (const item of items) {
    const stock = stocks.find(
      s =>
        s.productoId.toString() ===
        item.productoId
    )

    if (!stock || !stock.habilitado) {
      stockMap[item.productoId] = {
        stockDisponible: 0,
        habilitado: false,
      }
      continue
    }

    const factor =
      item.factorUnidad && item.factorUnidad > 0
        ? item.factorUnidad
        : 1

    stockMap[item.productoId] = {
      stockDisponible: Math.floor(
        stock.cantidad / factor
      ),
      habilitado: true,
    }
  }

  return stockMap
}