import { Request, Response } from 'express'
import Producto from './producto.model'
import { inicializarStockPorProducto } from '../stock/stock.service'

// ===============================
// GET productos (POS / Admin)
// ===============================
export const getProductos = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query

    const filter =
      includeInactive === 'true'
        ? {}
        : { activo: true }

    const productos = await Producto.find(filter)
      .populate('proveedorId', 'nombre') // 👈 CLAVE PARA ADMIN

    res.json(productos)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error al obtener los productos',
      error,
    })
  }
}

// ===============================
// CREATE producto
// ===============================
export const createProducto = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      categoriaId,
      proveedorId, // 👈 NUEVO
      activo,
      unidadBase,
      presentaciones,
      reglasPrecio,
      fechaVencimiento,
      imagenUrl,
      codigo,
    } = req.body

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      categoriaId,
      proveedorId: proveedorId ?? null, // 👈 CLAVE
      activo,
      unidadBase,
      presentaciones,
      reglasPrecio,
      fechaVencimiento,
      imagenUrl,
      codigo,
    })

    // crear stock en 0
    await inicializarStockPorProducto(nuevoProducto._id)

    await nuevoProducto.save()
    res.status(201).json(nuevoProducto)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error al crear el producto',
      error,
    })
  }
}

// ===============================
// UPDATE producto
// ===============================
export const updateProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const {
      proveedorId,
      ...rest
    } = req.body

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      {
        ...rest,
        proveedorId: proveedorId ?? null, // 👈 SIEMPRE SE SETEA
      },
      { new: true }
    ).populate('proveedorId', 'nombre')

    if (!productoActualizado) {
      return res.status(404).json({
        message: 'Producto no encontrado',
      })
    }

    res.json(productoActualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error al actualizar el producto',
      error,
    })
  }
}

// ===============================
// Buscar por código (POS)
// ===============================
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
  } catch (error) {
    res.status(500).json({
      message: 'Error al buscar producto',
      error,
    })
  }
}

// ===============================
// Activar / desactivar producto
// ===============================
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

    res.json(producto)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar estado',
      error,
    })
  }
}
