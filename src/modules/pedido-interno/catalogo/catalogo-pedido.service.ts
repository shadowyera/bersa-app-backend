import { Types } from 'mongoose'
import { StockSucursalModel } from '../../stock/stock.model';
import { isProductoHabilitadoParaPedido } from '../../stock/stock.rules';


/* =====================================================
   Types internos (solo para este service)
   -----------------------------------------------------
   Mongoose + populate + lean no infieren bien tipos,
   así que declaramos la vista populada explícitamente.
===================================================== */

interface ProductoPopulado {
  _id: Types.ObjectId
  nombre: string
  activo: boolean

  categoriaId: {
    _id: Types.ObjectId
    nombre: string
  }

  proveedorId?: {
    _id: Types.ObjectId
    nombre: string
  }
}

interface StockSucursalPopulado {
  _id: Types.ObjectId
  cantidad: number // SIEMPRE en unidad base
  habilitado: boolean

  productoId: ProductoPopulado
}

/* =====================================================
   DTO público para CrearPedido
===================================================== */

export interface ProductoCatalogoParaPedido {
  stockId: string
  productoId: string

  nombre: string
  stockActual: number
  habilitado: boolean

  categoria: {
    id: string
    nombre: string
  }

  proveedor: {
    id: string
    nombre: string
  } | null
}

/* =====================================================
   Service: Catálogo para Pedido Interno
   -----------------------------------------------------
   - Fuente de verdad: StockSucursal
   - SOLO lectura
   - Optimizado para UX de CrearPedido
===================================================== */

export async function getCatalogoParaPedido(
  sucursalId: string
): Promise<ProductoCatalogoParaPedido[]> {
  if (!Types.ObjectId.isValid(sucursalId)) {
    throw new Error('sucursalId inválido')
  }

  /**
   * Obtenemos stock por sucursal.
   * - Respetamos habilitado
   * - Populamos producto + categoría + proveedor
   */
  const stock = await StockSucursalModel.find({
    sucursalId,
    habilitado: true,
  })
    .populate({
      path: 'productoId',
      select: 'nombre activo categoriaId proveedorId',
      populate: [
        {
          path: 'categoriaId',
          select: 'nombre',
        },
        {
          path: 'proveedorId',
          select: 'nombre',
        },
      ],
    })
    .lean<StockSucursalPopulado[]>()

  /**
   * Normalización a DTO plano para frontend
   */
  return stock
    .filter(isProductoHabilitadoParaPedido)
    .map(s => ({
      stockId: s._id.toString(),
      productoId: s.productoId._id.toString(),

      nombre: s.productoId.nombre,
      stockActual: s.cantidad,
      habilitado: s.habilitado,

      categoria: {
        id: s.productoId.categoriaId._id.toString(),
        nombre: s.productoId.categoriaId.nombre,
      },

      proveedor: s.productoId.proveedorId
        ? {
            id: s.productoId.proveedorId._id.toString(),
            nombre:
              s.productoId.proveedorId.nombre,
          }
        : null,
    }))
}