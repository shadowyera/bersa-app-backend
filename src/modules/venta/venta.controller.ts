import { Request, Response } from 'express'
import { Types } from 'mongoose'

import {
  crearVentaPOS,
  anularVentaPOS,
  obtenerVentaDetalle,
  listarVentasAdmin,
  obtenerVentaDetalleAdmin,
} from './venta.service'

/* =====================================================
   CREAR VENTA POS
===================================================== */

export const createVentaPOS = async (
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

    const {
      cajaId,
      aperturaCajaId,
      items,
      pagos,
      documentoTributario,
    } = req.body

    if (
      !cajaId ||
      !aperturaCajaId ||
      !items ||
      !pagos ||
      !documentoTributario
    ) {
      return res
        .status(400)
        .json({ message: 'Datos incompletos' })
    }

    const venta = await crearVentaPOS({
      cajaId: new Types.ObjectId(cajaId),
      aperturaCajaId: new Types.ObjectId(aperturaCajaId),
      usuarioId: new Types.ObjectId(user._id),

      items: items.map((i: any) => ({
        productoId: new Types.ObjectId(i.productoId),
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),

      pagos,

      documentoTributario: {
        tipo: documentoTributario.tipo,
        receptor: documentoTributario.receptor,
      },
    })

    return res.status(201).json(venta)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   ANULAR VENTA POS
===================================================== */

export const anularVentaController = async (
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

    const { ventaId } = req.params

    if (!Types.ObjectId.isValid(ventaId)) {
      return res
        .status(400)
        .json({ message: 'Venta inválida' })
    }

    const result = await anularVentaPOS(
      new Types.ObjectId(ventaId)
    )

    return res.json({
      message: 'Venta anulada correctamente',
      ...result,
    })

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   DETALLE VENTA POS
===================================================== */

export const getVentaDetalleController = async (
  req: Request,
  res: Response
) => {
  try {

    const { ventaId } = req.params

    if (!Types.ObjectId.isValid(ventaId)) {
      return res
        .status(400)
        .json({ message: 'ID inválido' })
    }

    const venta = await obtenerVentaDetalle(
      new Types.ObjectId(ventaId)
    )

    return res.json(venta)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

/* =====================================================
   LISTAR VENTAS ADMIN (PAGINADO)
===================================================== */

export const listarVentasAdminController = async (
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

    const {
      from,
      to,
      sucursalId,
      cajaId,
      usuarioId,
      estado,
      tipoDocumento,
      folio,
      page,
      limit,
    } = req.query

    const result = await listarVentasAdmin({

      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,

      sucursalId: sucursalId
        ? new Types.ObjectId(sucursalId as string)
        : undefined,

      cajaId: cajaId
        ? new Types.ObjectId(cajaId as string)
        : undefined,

      usuarioId: usuarioId
        ? new Types.ObjectId(usuarioId as string)
        : undefined,

      estado: estado as
        | 'FINALIZADA'
        | 'ANULADA'
        | undefined,

      tipoDocumento: tipoDocumento as
        | 'BOLETA'
        | 'FACTURA'
        | undefined,

      folio: folio as string | undefined,

      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
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
   DETALLE VENTA ADMIN
===================================================== */

export const getVentaDetalleAdminController = async (
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

    const { ventaId } = req.params

    if (!Types.ObjectId.isValid(ventaId)) {
      return res
        .status(400)
        .json({ message: 'ID inválido' })
    }

    const venta =
      await obtenerVentaDetalleAdmin(
        new Types.ObjectId(ventaId)
      )

    res.set('Cache-Control', 'no-store')
    return res.json(venta)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}