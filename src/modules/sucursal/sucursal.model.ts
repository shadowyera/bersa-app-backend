import { Schema, model, Document } from 'mongoose'

export interface Sucursal extends Document {
  nombre: string
  codigo: string
  direccion: string
  telefono: string
  activo: boolean
  modoAjusteInventario: boolean

  /**
   * Indica si esta sucursal es la bodega / sala principal
   * (origen logístico)
   */
  esPrincipal: boolean
}

const sucursalSchema = new Schema<Sucursal>({
  nombre: {
    type: String,
    required: true
  },

  codigo: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    unique: true,
    index: true
  },

  direccion: {
    type: String,
    required: true
  },

  telefono: {
    type: String,
    required: true
  },

  activo: {
    type: Boolean,
    default: true
  },

  modoAjusteInventario: {
    type: Boolean,
    default: false
  },

  /**
   * Flag logístico (NO hardcode)
   */
  esPrincipal: {
    type: Boolean,
    default: false
  }
})

const SucursalModel = model<Sucursal>(
  'Sucursal',
  sucursalSchema
)

export default SucursalModel