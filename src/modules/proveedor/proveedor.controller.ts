import { Request, Response } from 'express'
import { Types } from 'mongoose'

import {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  toggleProveedorActivo,
} from './proveedor.service'

/* =====================================================
   LISTAR PROVEEDORES (ADMIN)
===================================================== */

export const listarProveedoresController = async (
  req: Request,
  res: Response
) => {
  try {

    const user = req.user

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    if (user.rol !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'No autorizado' })
    }

    const { search, activo } = req.query

    const result = await listarProveedores({
      search: search as string | undefined,
      activo:
        activo !== undefined
          ? activo === 'true'
          : undefined,
    })

    res.set('Cache-Control', 'no-store')
    return res.json(result)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   CREAR PROVEEDOR
===================================================== */

export const crearProveedorController = async (
  req: Request,
  res: Response
) => {
  try {

    const user = req.user

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    if (user.rol !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'No autorizado' })
    }

    const { nombre } = req.body

    const proveedor = await crearProveedor({
      nombre,
    })

    return res.status(201).json(proveedor)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   ACTUALIZAR PROVEEDOR
===================================================== */

export const actualizarProveedorController = async (
  req: Request,
  res: Response
) => {
  try {

    const user = req.user

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    if (user.rol !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'No autorizado' })
    }

    const { id } = req.params
    const { nombre } = req.body

    if (!Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: 'ID inválido' })
    }

    const proveedor = await actualizarProveedor({
      proveedorId: new Types.ObjectId(id),
      nombre,
    })

    return res.json(proveedor)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   TOGGLE ACTIVO
===================================================== */

export const toggleProveedorActivoController = async (
  req: Request,
  res: Response
) => {
  try {

    const user = req.user

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    if (user.rol !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'No autorizado' })
    }

    const { id } = req.params
    const { activo } = req.body

    if (!Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: 'ID inválido' })
    }

    if (typeof activo !== 'boolean') {
      return res
        .status(400)
        .json({ message: 'Campo activo inválido' })
    }

    const proveedor = await toggleProveedorActivo({
      proveedorId: new Types.ObjectId(id),
      activo,
    })

    return res.json(proveedor)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}