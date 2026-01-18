import { Schema, model, Types } from 'mongoose'

export type ROL_USUARIO =
  | 'ADMIN'
  | 'ENCARGADO'
  | 'CAJERO'
  | 'BODEGUERO'

export interface Usuario {
  _id: Types.ObjectId
  nombre: string
  email: string
  passwordHash: string
  rol: ROL_USUARIO
  sucursalId: Types.ObjectId
  activo: boolean
}

const usuarioSchema = new Schema<Usuario>(
  {
    nombre: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    rol: {
      type: String,
      enum: ['ADMIN', 'ENCARGADO', 'CAJERO'],
      required: true,
    },

    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export const UsuarioModel = model<Usuario>('Usuario', usuarioSchema)