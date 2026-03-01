import { AuthenticatedUser } from './auth.types'

export function buildSession(user: AuthenticatedUser) {
  const puedeVerTodasLasSucursales =
    user.rol === 'ADMIN' ||
    (user.rol === 'ENCARGADO' &&
      user.sucursal.esPrincipal)

  const puedeGestionarUsuarios =
    user.rol === 'ADMIN'

  return {
    id: user._id,
    nombre: user.nombre,
    rol: user.rol,
    sucursal: user.sucursal,
    permisos: {
      puedeVerTodasLasSucursales,
      puedeGestionarUsuarios,
    },
  }
}