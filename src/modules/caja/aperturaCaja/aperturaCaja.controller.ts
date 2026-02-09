import { Request, Response } from 'express'
import { Types } from 'mongoose'
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

    const { cajaId } = req.params
    const { montoInicial } = req.body

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'Caja inválida' })
    }

    const apertura = await abrirCajaApp({
      cajaId: new Types.ObjectId(cajaId),
      sucursalId: new Types.ObjectId(user.sucursalId),
      usuarioId: new Types.ObjectId(user._id),

      // 👇 CONTEXTO HUMANO DESDE JWT (CLAVE)
      usuarioNombre: user.nombre,

      montoInicial: Number(montoInicial),
    })

    res.status(201).json(apertura)
  } catch (error: any) {
    res
      .status(400)
      .json({ message: error.message })
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

    const apertura = await getAperturaActiva(
      new Types.ObjectId(cajaId)
    )

    res.json(apertura)
  } catch (error) {
    res.status(500).json({
      message:
        'Error al obtener apertura activa',
    })
  }
}