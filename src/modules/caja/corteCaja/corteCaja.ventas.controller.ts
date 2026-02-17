import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { obtenerVentasAperturaActiva } from './corteCaja.ventas'

/**
 * ================================
 * LISTAR VENTAS DE APERTURA ACTIVA
 * ================================
 */
export const getVentasAperturaController = async (
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

    const data = await obtenerVentasAperturaActiva(
      new Types.ObjectId(cajaId)
    )

    return res.json(data)
  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}