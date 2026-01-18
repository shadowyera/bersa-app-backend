import { ROL_USUARIO } from '../users/usuario.model'

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string
        rol: ROL_USUARIO
        sucursalId: string
      }
    }
  }
}