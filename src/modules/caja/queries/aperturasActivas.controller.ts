import type { Request, Response } from 'express'
import { getAperturasActivas } from './aperturasActivas.service'

export async function getAperturasActivasController(
  req: Request,
  res: Response
) {
  try {
    const { sucursalId } = req.query

    if (!sucursalId || typeof sucursalId !== 'string') {
      return res.status(400).json({
        message: 'sucursalId es requerido',
      })
    }

    const aperturas = await getAperturasActivas(sucursalId)

    res.json(aperturas)
  } catch (error) {
    console.error('[getAperturasActivas]', error)
    res.status(500).json({
      message: 'Error obteniendo aperturas activas',
    })
  }
}