import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { calcularCorteCajeros } from './corteCaja.calculo'

export const getCorteCajerosController = async (
  req: Request,
  res: Response
) => {
  try {
    const { cajaId } = req.params

    if (!Types.ObjectId.isValid(cajaId)) {
      return res.status(400).json({ message: 'Caja inválida' })
    }

    const corte = await calcularCorteCajeros(
      new Types.ObjectId(cajaId)
    )

    res.json(corte)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}