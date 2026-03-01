import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import SucursalModel from '../sucursal/sucursal.model'
import { ROL_USUARIO } from '../usuario/usuario.model'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      _id: string
      nombre: string
      rol: ROL_USUARIO
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
      sucursal: {
        id: sucursal._id.toString(),
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