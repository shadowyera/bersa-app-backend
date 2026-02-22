import { Request, Response } from 'express'
import { listarAperturasAdmin, obtenerAperturaAdminDetalle } from './aperturasAdmin.service'

/* =====================================================
   LISTAR APERTURAS (ADMIN)
===================================================== */

export const listarAperturasAdminController = async (
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
      page,
      limit,
    } = req.query

    const result = await listarAperturasAdmin({
      from: from
        ? new Date(`${from}T00:00:00.000Z`)
        : undefined,

      to: to
        ? new Date(`${to}T23:59:59.999Z`)
        : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    })

    // Evitar cache
    res.set('Cache-Control', 'no-store')

    return res.json(result)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }
}

export const obtenerAperturaAdminDetalleController = async (
  req: Request,
  res: Response
) => {

  try {

    const user = req.user

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    if (user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'No autorizado' })
    }

    const { id } = req.params

    const result =
      await obtenerAperturaAdminDetalle(id)

    res.set('Cache-Control', 'no-store')

    return res.json(result)

  } catch (e: any) {
    return res
      .status(400)
      .json({ message: e.message })
  }

}