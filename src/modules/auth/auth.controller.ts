import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { UsuarioModel } from '../usuario/usuario.model'

/**
 * POST /api/auth/login
 * - Valida credenciales
 * - Firma JWT con contexto necesario para backend
 * - Setea cookie httpOnly
 * - Devuelve usuario para UI
 */
export const loginController = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body

  const usuario = await UsuarioModel.findOne({
    email,
    activo: true,
  })

  if (!usuario) {
    return res
      .status(401)
      .json({ message: 'Credenciales inválidas' })
  }

  const ok = await bcrypt.compare(
    password,
    usuario.passwordHash
  )

  if (!ok) {
    return res
      .status(401)
      .json({ message: 'Credenciales inválidas' })
  }

  const token = jwt.sign(
    {
      _id: usuario._id.toString(),
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId.toString(),
    },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true en prod (https)
    path: '/',
  })

  res.json({
    user: {
      _id: usuario._id.toString(),
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId.toString(),
    },
  })
}

/**
 * GET /api/auth/me
 * - Fuente de verdad post-refresh
 * - Siempre devuelve el usuario completo
 */
export const meController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: 'No autenticado' })
    }

    const usuario = await UsuarioModel.findById(
      req.user._id
    )
      .select('_id nombre rol sucursalId')
      .lean()

    if (!usuario) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado' })
    }

    res.json({
      user: {
        _id: usuario._id.toString(),
        nombre: usuario.nombre,
        rol: usuario.rol,
        sucursalId: usuario.sucursalId.toString(),
      },
    })
  } catch (error) {
    console.error('[ME]', error)
    res
      .status(500)
      .json({ message: 'Error interno' })
  }
}

/**
 * POST /api/auth/logout
 * - Borra cookie de autenticación
 */
export const logoutController = (
  _req: Request,
  res: Response
) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // true en prod
    path: '/',
  })

  res.json({ ok: true })
}