import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { CajaModel } from '../caja.model'
import { abrirCajaApp } from './aperturaCaja.usecase'
import { getAperturaActiva } from './aperturaCaja.service'

/**
 * POST /api/cajas/:cajaId/abrir
 * Abre una caja (crea la apertura)
 */
export const abrirCajaController = async (
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

    if (!user.sucursal?.id) {
      return res
        .status(400)
        .json({
          message: 'Sucursal inválida en sesión',
        })
    }

    const { cajaId } = req.params
    const { montoInicial } = req.body

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'Caja inválida' })
    }

    const caja = await CajaModel.findById(cajaId)

    if (!caja) {
      return res
        .status(404)
        .json({ message: 'Caja no encontrada' })
    }

    // 🔐 Blindaje crítico: validar que la caja pertenece a la sucursal del usuario
    if (
      caja.sucursalId.toString() !==
      user.sucursal.id
    ) {
      return res
        .status(403)
        .json({
          message:
            'La caja no pertenece a tu sucursal',
        })
    }

    const apertura = await abrirCajaApp({
      cajaId: new Types.ObjectId(cajaId),
      sucursalId: new Types.ObjectId(
        user.sucursal.id
      ),
      usuarioId: new Types.ObjectId(user._id),
      usuarioNombre: user.nombre,
      montoInicial: Number(montoInicial),
    })

    return res.status(201).json(apertura)
  } catch (error: any) {
    console.error(
      '[abrirCajaController]',
      error
    )

    return res.status(400).json({
      message:
        error?.message ??
        'Error al abrir caja',
    })
  }
}

/**
 * GET /api/cajas/:cajaId/apertura-activa
 * Devuelve la apertura activa de la caja
 */
export const getAperturaActivaController = async (
  req: Request,
  res: Response
) => {
  try {
    const { cajaId } = req.params

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'Caja inválida' })
    }

    const apertura =
      await getAperturaActiva(
        new Types.ObjectId(cajaId)
      )

    return res.json(apertura)
  } catch (error) {
    console.error(
      '[getAperturaActivaController]',
      error
    )

    return res.status(500).json({
      message:
        'Error al obtener apertura activa',
    })
  }
}