import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { UsuarioModel } from '../usuario/usuario.model'

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const usuario = await UsuarioModel.findOne({ email, activo: true })
  if (!usuario) {
    return res.status(401).json({ message: 'Credenciales inválidas' })
  }

  const ok = await bcrypt.compare(password, usuario.passwordHash)
  if (!ok) {
    return res.status(401).json({ message: 'Credenciales inválidas' })
  }

  const token = jwt.sign(
    {
      _id: usuario._id,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  // 🔥 COOKIE ÚNICA FUENTE DE AUTH
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true en prod
  })

  res.json({
    user: {
      _id: usuario._id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    },
  })
}

export const meController = async (req: Request, res: Response) => {
  res.json({ user: req.user })
}

export const logoutController = (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ ok: true })
}