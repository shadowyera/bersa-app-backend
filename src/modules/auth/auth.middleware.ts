import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import SucursalModel from '../sucursal/sucursal.model'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const token = req.cookies?.token

  if (!token) {
    return res
      .status(401)
      .json({ message: 'No autorizado' })
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      _id: string
      nombre: string
      rol: string
      sucursalId: string
    }

    const sucursal = await SucursalModel.findById(
      decoded.sucursalId
    )
      .select('_id esPrincipal activo')
      .lean()

    if (!sucursal || !sucursal.activo) {
      return res
        .status(401)
        .json({ message: 'Sucursal inválida' })
    }

    req.user = {
      _id: decoded._id,
      nombre: decoded.nombre,
      rol: decoded.rol,
      sucursalId: decoded.sucursalId,
      sucursal: {
        esPrincipal: sucursal.esPrincipal,
      },
    }

    next()

  } catch (error) {
    console.error('[AUTH]', error)
    return res
      .status(401)
      .json({ message: 'Token inválido' })
  }
}