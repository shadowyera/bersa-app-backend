// src/modules/producto/producto.controller.ts
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

    // Activos por defecto
    if (includeInactive !== 'true') {
      query.activo = true
    }

    // Búsqueda opcional
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

    res.json({
      data: productos,
      page: pageNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener los productos',
    })
  }
}

/* ======================================================
   CREATE producto
====================================================== */
export const createProducto = async (req: Request, res: Response) => {
  try {
    const nuevoProducto = new Producto({
      ...req.body,
      proveedorId: req.body.proveedorId ?? null,
      activo: req.body.activo ?? true,
    })

    await inicializarStockPorProducto(nuevoProducto._id)
    await nuevoProducto.save()

    emitRealtimeEvent({
      type: 'PRODUCTO_CREATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId: req.user._id.toString(),
      productoId: nuevoProducto._id.toString(),
    })

    res.status(201).json(nuevoProducto)
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear el producto',
    })
  }
}

/* ======================================================
   UPDATE producto
====================================================== */
export const updateProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { proveedorId, ...rest } = req.body

    const producto = await Producto.findByIdAndUpdate(
      id,
      {
        ...rest,
        proveedorId: proveedorId ?? null,
      },
      { new: true }
    ).populate('proveedorId', 'nombre')

    if (!producto) {
      return res
        .status(404)
        .json({ message: 'Producto no encontrado' })
    }

    emitRealtimeEvent({
      type: 'PRODUCTO_UPDATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId: req.user._id.toString(),
      productoId: producto._id.toString(),
    })

    res.json(producto)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar el producto',
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
    })

    if (!producto) {
      return res.status(404).json(null)
    }

    res.json(producto)
  } catch {
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
      return res
        .status(404)
        .json({ message: 'Producto no encontrado' })
    }

    producto.activo = Boolean(activo)
    await producto.save()

    emitRealtimeEvent({
      type: 'PRODUCTO_UPDATED',
      sucursalId: 'GLOBAL',
      origenUsuarioId: req.user._id.toString(),
      productoId: producto._id.toString(),
    })

    res.json(producto)
  } catch {
    res.status(500).json({
      message: 'Error al actualizar estado',
    })
  }
}