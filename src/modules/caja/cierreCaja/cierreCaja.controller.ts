import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { cerrarCajaAutomaticoApp } from './cierreCaja.usecase'
import { calcularResumenCaja } from './cierreCaja.calculo'

export const cerrarCajaController = async (
  req: Request,
  res: Response
) => {
  try {

    /* ============================
       Auth
    ============================ */

    const user = req.user

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    /* ============================
       Params
    ============================ */

    const { cajaId } = req.params
    const { montoFinal, motivoDiferencia } = req.body

    if (!Types.ObjectId.isValid(cajaId)) {
      return res
        .status(400)
        .json({ message: 'CajaId inválido' })
    }

    /* ============================
       Usecase
    ============================ */

    const resumen = await cerrarCajaAutomaticoApp({
      cajaId: new Types.ObjectId(cajaId),
      montoFinal: Number(montoFinal),
      motivoDiferencia,
      usuarioId: new Types.ObjectId(user._id),
      rol: user.rol,
      sucursalId: new Types.ObjectId(user.sucursalId),
      usuarioNombre: user.nombre,
    })

    return res.json(resumen)

  } catch (e: any) {

    return res
      .status(400)
      .json({ message: e.message })

  }
}

/* =====================================
   Resumen previo (sin cambios)
===================================== */

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

    return res.json(resumen)

  } catch (e: any) {

    return res
      .status(400)
      .json({ message: e.message })

  }
}