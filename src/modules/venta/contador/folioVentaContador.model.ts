import { Schema, model, Types } from 'mongoose'

/**
 * Guarda el último folio usado por sucursal
 */
export interface FolioVentaContador {
  sucursalId: Types.ObjectId
  ultimoNumero: number
}

const folioVentaContadorSchema =
  new Schema<FolioVentaContador>(
    {
      sucursalId: {
        type: Schema.Types.ObjectId,
        ref: 'Sucursal',
        required: true,
        unique: true
      },

      ultimoNumero: {
        type: Number,
        required: true,
        default: 0
      }
    },
    { timestamps: false }
  )

export const FolioVentaContadorModel =
  model<FolioVentaContador>(
    'FolioVentaContador',
    folioVentaContadorSchema
  )