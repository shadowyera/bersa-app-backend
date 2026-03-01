import { Request, Response, NextFunction } from 'express'
import { ROL_USUARIO } from '../usuario/usuario.model'
import { AuthenticatedUser } from './auth.types'

export function requireRole(
  roles: ROL_USUARIO[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user as AuthenticatedUser | undefined

    if (!user) {
      return res
        .status(401)
        .json({ message: 'No autorizado' })
    }

    if (!roles.includes(user.rol)) {
      return res
        .status(403)
        .json({
          message: 'No tienes permisos para esta acción',
        })
    }

    next()
  }
}