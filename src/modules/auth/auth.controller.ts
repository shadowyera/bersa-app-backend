import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { UsuarioModel } from '../usuario/usuario.model'
import SucursalModel from '../sucursal/sucursal.model'
import { buildSession } from './buildSession'

/**
 * POST /api/auth/login
 * - Valida credenciales
 * - Firma JWT minimal
 * - Setea cookie httpOnly
 * - Devuelve sesión enriquecida (UserSession)
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

  const sucursal = await SucursalModel.findById(
    usuario.sucursalId
  )
    .select('_id esPrincipal activo')
    .lean()

  if (!sucursal || !sucursal.activo) {
    return res
      .status(401)
      .json({ message: 'Sucursal inválida' })
  }

  // 🔐 JWT minimal (solo para backend)
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
    sameSite: 'none',
    secure: true,
    path: '/',
  })

  // 👇 Construimos usuario autenticado coherente
  const authenticatedUser = {
    _id: usuario._id.toString(),
    nombre: usuario.nombre,
    rol: usuario.rol,
    sucursal: {
      id: sucursal._id.toString(),
      esPrincipal: sucursal.esPrincipal,
    },
  }

  const session = buildSession(authenticatedUser)

  res.json({ user: session })
}

/**
 * GET /api/auth/me
 * - Usa req.user del middleware
 * - No consulta base de datos nuevamente
 * - Devuelve sesión consistente
 */
export const meController = (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: 'No autenticado' })
  }

  const session = buildSession(req.user)

  res.json({ user: session })
}

/**
 * POST /api/auth/logout
 */
export const logoutController = (
  _req: Request,
  res: Response
) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
  })

  res.json({ ok: true })
}