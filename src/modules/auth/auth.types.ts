import { ROL_USUARIO } from '../usuario/usuario.model'

export interface AuthenticatedUser {
  _id: string
  nombre: string
  rol: ROL_USUARIO

  sucursal: {
    id: string
    esPrincipal: boolean
  }
}