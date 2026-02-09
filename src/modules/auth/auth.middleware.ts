import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      _id: string
      nombre: string
      rol: string
      sucursalId: string
    }

    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido' })
  }
}