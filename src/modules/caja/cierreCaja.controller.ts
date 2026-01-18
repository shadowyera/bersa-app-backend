import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { cerrarCajaAutomatico } from './cierreCaja.service'
import { calcularResumenCaja } from './cierreCaja.calculo'
import { emitRealtimeEvent } from '../realtime/realtime.service'

/**
 * POST /api/cajas/:cajaId/cerrar-automatico
 */
export const cerrarCajaController = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    const { cajaId } = req.params
    const { montoFinal } = req.body

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'CajaId inválido' })
    }

    const resumen = await cerrarCajaAutomatico({
      cajaId: new Types.ObjectId(cajaId),
      montoFinal: Number(montoFinal),
      usuarioId: new Types.ObjectId(user._id),
      rol: user.rol,
    })

    // 🔔 AVISO EN TIEMPO REAL
    emitRealtimeEvent({
      type: 'CAJA_CERRADA',
      sucursalId: user.sucursalId,
      cajaId,
    })

    res.json(resumen)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}

/**
 * GET /api/cajas/:cajaId/resumen-previo
 */
export const resumenPrevioCajaController = async (
  req: Request,
  res: Response
) => {
  try {
    const { cajaId } = req.params

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'CajaId inválido' })
    }

    const resumen = await calcularResumenCaja(
      new Types.ObjectId(cajaId)
    )

    res.json(resumen)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}