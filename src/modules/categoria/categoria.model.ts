import { Schema, model, Document } from 'mongoose'

export type TipoCategoria =
  | 'NORMAL'
  | 'ALCOHOL'
  | 'SERVICIO'
  | 'PROMO'

export interface Categoria extends Document {
  nombre: string
  descripcion: string
  slug: string
  activo: boolean
  orden: number
  color?: string
  tipo: TipoCategoria
  createdAt: Date
  updatedAt: Date
}

const categoriaSchema = new Schema<Categoria>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
    },
    tipo: {
      type: String,
      enum: ['NORMAL', 'ALCOHOL', 'SERVICIO', 'PROMO'],
      default: 'NORMAL',
    },
  },
  {
    timestamps: true,
  }
)

export const CategoriaModel = model<Categoria>(
  'Categoria',
  categoriaSchema
)