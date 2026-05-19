import { Request, Response } from 'express'
import Producto from './producto.model'
import { inicializarStockPorProducto } from '../stock/stock.service'
import { emitRealtimeEvent } from '../realtime/realtime.service'

/* ======================================================
   GET productos (POS / Admin)
====================================================== */
export const getProductos = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      includeInactive,
      page = 1,
      limit = 20,
      search,
    } = req.query

    const query: any = {}

    /* ======================================================
       Activos por defecto
    ====================================================== */

    if (includeInactive !== 'true') {
      query.activo = true
    }

    /* ======================================================
       Búsqueda
    ====================================================== */

    if (search && typeof search === 'string') {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
      ]
    }

    const pageNumber = Number(page)
    const limitNumber = Number(limit)

    const skip = (pageNumber - 1) * limitNumber

    const [productos, total] = await Promise.all([
      Producto.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Producto.countDocuments(query),
    ])

    return res.json({
      data: productos,
      page: pageNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    })
  } catch (error) {
    console.error('GET productos error:', error)

    res.status(500).json({
      message: 'Error al obtener los productos',
    })
  }
}

/* ======================================================
   CREATE producto
====================================================== */
export const createProducto = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      proveedorId,
      ...rest
    } = req.body

    const nuevoProducto = new Producto({
      ...rest,
      proveedorId: proveedorId || null,
      activo: req.body.activo ?? true,
    })

    /* ======================================================
       Guardar primero
    ====================================================== */

    await nuevoProducto.save()

    /* ======================================================
       Inicializar stock
    ====================================================== */

    await inicializarStockPorProducto(
      nuevoProducto._id
    )

    /* ======================================================
       Realtime
    ====================================================== */

    emitRealtimeEvent({
      type: 'PRODUCTO_CREATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId:
        req.user?._id?.toString() ?? 'system',
      productoId: nuevoProducto._id.toString(),
    })

    return res.status(201).json(nuevoProducto)
  } catch (error) {
    console.error('CREATE producto error:', error)

    res.status(500).json({
      message: 'Error al crear el producto',
      error,
    })
  }
}

/* ======================================================
   UPDATE producto
====================================================== */
export const updateProducto = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params
    const { proveedorId, ...rest } = req.body

    const producto = await Producto.findByIdAndUpdate(
      id,
      {
        ...rest,
        proveedorId: proveedorId || null,
      },
      { new: true }
    )

    if (!producto) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      })
    }

    emitRealtimeEvent({
      type: 'PRODUCTO_UPDATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId:
        req.user?._id?.toString() ?? 'system',
      productoId: producto._id.toString(),
    })

    return res.json(producto)
  } catch (error) {
    console.error('UPDATE producto error:', error)

    res.status(500).json({
      message: 'Error al actualizar el producto',
      error,
    })
  }
}

/* ======================================================
   Buscar producto por código (POS)
====================================================== */
export const buscarProductoPorCodigo = async (
  req: Request,
  res: Response
) => {
  try {
    const { codigo } = req.params

    const producto = await Producto.findOne({
      codigo,
      activo: true,
    }).lean()

    if (!producto) {
      return res.status(404).json(null)
    }

    return res.json(producto)
  } catch (error) {
    console.error(
      'Buscar producto por código error:',
      error
    )

    res.status(500).json({
      message: 'Error al buscar producto',
    })
  }
}

/* ======================================================
   Activar / desactivar producto
====================================================== */
export const setProductoActivo = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params
    const { activo } = req.body

    const producto = await Producto.findById(id)

    if (!producto) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      })
    }

    producto.activo = Boolean(activo)

    await producto.save()

    emitRealtimeEvent({
      type: 'PRODUCTO_UPDATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId:
        req.user?._id?.toString() ?? 'system',
      productoId: producto._id.toString(),
    })

    return res.json(producto)
  } catch (error) {
    console.error(
      'SET PRODUCTO ACTIVO error:',
      error
    )

    res.status(500).json({
      message: 'Error al actualizar estado',
    })
  }
}