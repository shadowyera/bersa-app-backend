import { Schema, model, Types } from 'mongoose'

/**
 * Guarda el último número de venta usado por apertura de caja
 */
export interface VentaContador {
  aperturaCajaId: Types.ObjectId
  ultimoNumero: number
}

const ventaContadorSchema = new Schema<VentaContador>(
  {
    aperturaCajaId: {
      type: Schema.Types.ObjectId,
      ref: 'AperturaCaja',
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

export const VentaContadorModel = model<VentaContador>(
  'VentaContador',
  ventaContadorSchema
)