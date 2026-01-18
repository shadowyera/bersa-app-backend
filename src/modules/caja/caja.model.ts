import { Schema, model, Types } from 'mongoose';

export interface Caja {
  _id: Types.ObjectId;
  nombre: string;
  sucursalId: Types.ObjectId;
  activa: boolean;
}

const cajaSchema = new Schema<Caja>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CajaModel = model<Caja>('Caja', cajaSchema);