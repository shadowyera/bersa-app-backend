import { Schema, model, Document } from 'mongoose';

export interface Proveedor extends Document {
  nombre: string;
  activo: boolean;
}

const proveedorSchema = new Schema<Proveedor>(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProveedorModel = model<Proveedor>(
  'Proveedor',
  proveedorSchema
);