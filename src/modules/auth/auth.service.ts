import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UsuarioModel } from '../usuario/usuario.model'

export const login = async (email: string, password: string) => {
  const usuario = await UsuarioModel.findOne({ email, activo: true })

  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  const ok = await bcrypt.compare(password, usuario.passwordHash)
  if (!ok) {
    throw new Error('Contraseña incorrecta')
  }

  const token = jwt.sign(
    {
      _id: usuario._id,
      nombre: usuario.nombre, // 👈 CLAVE
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  return {
    token,
    usuario: {
      _id: usuario._id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    },
  }
}