import { Schema, model, Types } from 'mongoose';

export interface StockSucursal {
  _id: Types.ObjectId;

  productoId: Types.ObjectId;
  sucursalId: Types.ObjectId;

  cantidad: number; // siempre en unidades base
  habilitado: boolean; // 👈 clave: si se vende en esta sucursal

  createdAt: Date;
  updatedAt: Date;
}

const stockSucursalSchema = new Schema<StockSucursal>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
      index: true,
    },
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },
    cantidad: {
      type: Number,
      required: true,
      default: 0,
    },
    habilitado: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// stock único por producto + sucursal
stockSucursalSchema.index(
  { productoId: 1, sucursalId: 1 },
  { unique: true }
);

export const StockSucursalModel = model<StockSucursal>(
  'StockSucursal',
  stockSucursalSchema
);
