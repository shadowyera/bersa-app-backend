import { Schema, model, Document } from 'mongoose';

interface Sucursal extends Document {
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  modoAjusteInventario: boolean;
}

const sucursalSchema = new Schema<Sucursal>({
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  activo: { type: Boolean, default: true },
  modoAjusteInventario: {
    type: Boolean,
    default: false,
  }
});

const SucursalModel = model<Sucursal>('Sucursal', sucursalSchema);

export default SucursalModel;
