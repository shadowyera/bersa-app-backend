import { PedidoInternoModel } from '../pedido-interno.model'
import ProductoModel from '../../producto/producto.model'
import { CategoriaModel } from '../../categoria/categoria.model'
import { ProveedorModel } from '../../proveedor/proveedor.model'
import { ESTADO_PEDIDO_INTERNO } from '../pedido-interno.types'

import {
  getStockPreparacionPorProductos,
} from '../../stock/stock-preparacion.service'

/* =====================================================
   Preparación de Pedido Interno (VISTA OPERATIVA)
   - Snapshot histórico del pedido
   - Enriquecido con categoría, proveedor y stock
===================================================== */

export async function getPedidoPreparacion(
  pedidoId: string,
  sucursalAbastecedoraId: string
) {
  const pedido = await PedidoInternoModel.findById(
    pedidoId
  ).lean()

  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (
    pedido.sucursalAbastecedoraId.toString() !==
    sucursalAbastecedoraId
  ) {
    throw new Error('No autorizado')
  }

  if (pedido.estado !== ESTADO_PEDIDO_INTERNO.CREADO) {
    throw new Error(
      'El pedido no está en estado preparable'
    )
  }

  /* ===============================
     Productos involucrados
  =============================== */
  const productoIds = pedido.items.map(item =>
    item.productoId.toString()
  )

  const productos = await ProductoModel.find({
    _id: { $in: productoIds },
  })
    .select('categoriaId proveedorId')
    .lean()

  const productoMap = new Map(
    productos.map(p => [
      p._id.toString(),
      p,
    ])
  )

  /* ===============================
     Categorías y proveedores
  =============================== */
  const categoriaIds = [
    ...new Set(
      productos.map(p =>
        p.categoriaId.toString()
      )
    ),
  ]

  const proveedorIds = [
    ...new Set(
      productos
        .map(p => p.proveedorId)
        .filter(Boolean)
        .map(p => p!.toString())
    ),
  ]

  const [categorias, proveedores] =
    await Promise.all([
      CategoriaModel.find({
        _id: { $in: categoriaIds },
      }).lean(),
      ProveedorModel.find({
        _id: { $in: proveedorIds },
      }).lean(),
    ])

  const categoriaMap = new Map(
    categorias.map(c => [
      c._id.toString(),
      c.nombre,
    ])
  )

  const proveedorMap = new Map(
    proveedores.map(p => [
      p._id.toString(),
      p.nombre,
    ])
  )

  /* ===============================
     Stock (batch + unidad pedida)
  =============================== */
  const stockMap =
    await getStockPreparacionPorProductos(
      sucursalAbastecedoraId,
      pedido.items.map(item => ({
        productoId: item.productoId.toString(),
        factorUnidad: item.factorUnidad,
      }))
    )

  /* ===============================
     Construcción final de items
  =============================== */
  const items = pedido.items.map(item => {
    const producto =
      productoMap.get(
        item.productoId.toString()
      )

    if (!producto) {
      throw new Error(
        `Producto no encontrado para item ${item.productoId}`
      )
    }

    const categoriaId =
      producto.categoriaId.toString()

    const proveedorId = producto.proveedorId
      ? producto.proveedorId.toString()
      : null

    const stock =
      stockMap[item.productoId.toString()] ??
      { stockDisponible: 0, habilitado: false }

    return {
      productoId: item.productoId.toString(),
      productoNombre: item.productoNombre,

      categoriaId,
      categoriaNombre:
        categoriaMap.get(categoriaId) ??
        'Sin categoría',

      proveedorId,
      proveedorNombre: proveedorId
        ? proveedorMap.get(proveedorId) ??
          'Sin proveedor'
        : 'Sin proveedor',

      cantidadSolicitada:
        item.cantidadSolicitada,
      unidadPedido: item.unidadPedido,

      cantidadPreparada:
        item.cantidadPreparada,

      stockDisponible:
        stock.stockDisponible,
      habilitado: stock.habilitado,
    }
  })

  return {
    pedidoId: pedido._id.toString(),
    estado: pedido.estado,

    filtros: {
      categorias: categorias.map(c => ({
        id: c._id.toString(),
        nombre: c.nombre,
      })),
      proveedores: proveedores.map(p => ({
        id: p._id.toString(),
        nombre: p.nombre,
      })),
    },

    items,
  }
}