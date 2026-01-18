import { Schema, model, Types } from 'mongoose'

/**
 * Item de una venta
 * Siempre en unidades base
 */
export interface VentaItem {
  productoId: Types.ObjectId
  cantidad: number
  precioUnitario: number
  subtotal: number
}

/**
 * Venta POS
 */
export interface Venta {
  _id: Types.ObjectId

  sucursalId: Types.ObjectId
  cajaId: Types.ObjectId
  aperturaCajaId: Types.ObjectId // 🔥 turno de caja
  usuarioId: Types.ObjectId      // quién vendió

  items: VentaItem[]

  /** Total real de los productos (sin redondeo) */
  total: number

  /** Ajuste por redondeo de efectivo (ej: +1, -2, 0) */
  ajusteRedondeo: number

  /** Total realmente cobrado al cliente (total + ajuste) */
  totalCobrado: number

  estado: 'ABIERTA' | 'FINALIZADA' | 'ANULADA'

  createdAt: Date
}

const ventaItemSchema = new Schema<VentaItem>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
)

const ventaSchema = new Schema<Venta>(
  {
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true
    },

    cajaId: {
      type: Schema.Types.ObjectId,
      ref: 'Caja',
      required: true,
      index: true
    },

    aperturaCajaId: {
      type: Schema.Types.ObjectId,
      ref: 'AperturaCaja',
      required: true,
      index: true
    },

    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true
    },

    items: {
      type: [ventaItemSchema],
      required: true,
      validate: [
        (items: VentaItem[]) => items.length > 0,
        'La venta debe tener al menos un item'
      ]
    },

    /** Total matemático de la venta */
    total: {
      type: Number,
      required: true,
      min: 0
    },

    /** Ajuste por redondeo */
    ajusteRedondeo: {
      type: Number,
      required: true,
      default: 0
    },

    /** Total efectivamente cobrado */
    totalCobrado: {
      type: Number,
      required: true,
      min: 0
    },

    estado: {
      type: String,
      enum: ['ABIERTA', 'FINALIZADA', 'ANULADA'],
      default: 'FINALIZADA',
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const VentaModel = model<Venta>('Venta', ventaSchema)
