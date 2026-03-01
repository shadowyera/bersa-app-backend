import { Schema, model, Types } from 'mongoose'

/* ======================================================
   INTERFACE
===================================================== */

export interface StockSucursal {
  _id: Types.ObjectId

  productoId: Types.ObjectId
  sucursalId: Types.ObjectId

  cantidad: number // siempre en unidades base
  habilitado: boolean // si se vende en esta sucursal

  createdAt: Date
  updatedAt: Date
}

/* ======================================================
   SCHEMA
===================================================== */

const stockSucursalSchema = new Schema<StockSucursal>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },

    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
    },

    cantidad: {
      type: Number,
      required: true,
      default: 0,
      min: 0, // 👈 evita negativos accidentales
    },

    habilitado: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

/* ======================================================
   ÍNDICES
===================================================== */

// 🔒 Stock único por producto + sucursal
stockSucursalSchema.index(
  { productoId: 1, sucursalId: 1 },
  { unique: true }
)

// 🚀 Optimiza consultas por sucursal (admin + POS)
stockSucursalSchema.index({ sucursalId: 1 })

// 🚀 Optimiza consultas POS (sucursal + habilitado)
stockSucursalSchema.index({
  sucursalId: 1,
  habilitado: 1,
})

/* ======================================================
   MODEL
===================================================== */

export const StockSucursalModel = model<StockSucursal>(
  'StockSucursal',
  stockSucursalSchema
)