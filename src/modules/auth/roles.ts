import { Request, Response, NextFunction } from 'express'
import { ROL_USUARIO } from '../usuario/usuario.model'

export const requireRole =
  (roles: ROL_USUARIO[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    if (!roles.includes(user.rol)) {
      return res.status(403).json({
        message: 'No tienes permisos',
      })
    }

    next()
  }