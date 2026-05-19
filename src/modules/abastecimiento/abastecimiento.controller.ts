import { Request, Response } from 'express'
import { AbastecimientoModel } from './abastecimiento.model'
import { registrarIngresoStock } from './abastecimiento.service'

/* ======================================================
   POST /api/abastecimientos/ingreso
====================================================== */

export const createIngresoStock = async (
  req: Request,
  res: Response
) => {

  try {

    const {
      sucursalDestinoId,
      items,
      observacion,
    } = req.body

    if (!sucursalDestinoId) {
      return res.status(400).json({
        message: 'sucursalDestinoId es requerido',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Debe ingresar al menos un producto',
      })
    }

    const abastecimiento =
      await registrarIngresoStock({
        sucursalDestinoId,
        observacion,
        createdBy: req.user._id,
        items,
      })

    return res.status(201).json({
      message: 'Ingreso de stock registrado correctamente',
      data: abastecimiento,
    })

  } catch (error: any) {

    return res.status(400).json({
      message:
        error.message ||
        'Error al registrar ingreso de stock',
    })

  }
}


export const getAbastecimientos = async (
  req: Request,
  res: Response
) => {

  try {

    const sucursalId = req.query.sucursalId as string

    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 10)

    const skip = (page - 1) * limit

    if (!sucursalId) {
      return res.status(400).json({
        message: 'sucursalId es requerido',
      })
    }

    const filter = {
      sucursalDestinoId: sucursalId,
    }

    const [data, total] = await Promise.all([

      AbastecimientoModel.find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)

        .populate({
          path: 'items.productoId',
          select: 'nombre unidadBase',
        })

        .populate({
          path: 'createdBy',
          select: 'nombre',
        })

        .lean(),

      AbastecimientoModel.countDocuments(filter),

    ])

    return res.json({
      data,
      total,
      page,
      limit,
    })



  } catch {

    return res.status(500).json({
      message: 'Error al obtener abastecimientos',
    })

  }

}

export const getAbastecimientoById = async (
  req: Request,
  res: Response
) => {

  try {

    const { id } = req.params

    const abastecimiento =
      await AbastecimientoModel.findById(id)

        .populate({
          path: 'items.productoId',
          select: 'nombre unidadBase',
        })

        .populate({
          path: 'createdBy',
          select: 'nombre',
        })

        .lean()

    if (!abastecimiento) {
      return res.status(404).json({
        message: 'Abastecimiento no encontrado',
      })
    }

    return res.json({
      data: abastecimiento,
    })

  } catch {

    return res.status(500).json({
      message:
        'Error al obtener abastecimiento',
    })

  }

}