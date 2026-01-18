import { Schema, model, Types } from 'mongoose';
import { TIPO_PAGO } from '../../shared/enums/tipoPago.enum';

export interface Pago {
  _id: Types.ObjectId;

  ventaId: Types.ObjectId;
  aperturaCajaId: Types.ObjectId;
  sucursalId: Types.ObjectId;

  tipo: TIPO_PAGO;
  monto: number;

  createdAt: Date;
}

const pagoSchema = new Schema<Pago>(
  {
    ventaId: {
      type: Schema.Types.ObjectId,
      ref: 'Venta',
      required: true,
      index: true,
    },
    aperturaCajaId: {
      type: Schema.Types.ObjectId,
      ref: 'AperturaCaja',
      required: true,
      index: true,
    },
    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TIPO_PAGO),
      required: true,
    },
    monto: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const PagoModel = model<Pago>('Pago', pagoSchema);
