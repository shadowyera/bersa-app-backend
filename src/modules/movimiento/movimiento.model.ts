// src/modules/movimiento/movimiento.model.ts
import { Schema, model, Types } from 'mongoose';

export enum TIPO_MOVIMIENTO {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

export enum SUBTIPO_MOVIMIENTO {
  COMPRA_PROVEEDOR = 'COMPRA_PROVEEDOR',
  VENTA_POS = 'VENTA_POS',
  TRANSFERENCIA_ENVIO = 'TRANSFERENCIA_ENVIO',
  TRANSFERENCIA_RECEPCION = 'TRANSFERENCIA_RECEPCION',
  AJUSTE_POSITIVO = 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO',
}

export interface Movimiento {
  _id: Types.ObjectId;
  tipoMovimiento: TIPO_MOVIMIENTO;
  subtipoMovimiento: SUBTIPO_MOVIMIENTO;

  productoId: Types.ObjectId;
  sucursalId: Types.ObjectId;

  cantidad: number; // siempre en unidades base (positiva)
  saldoAnterior: number;
  saldoPosterior: number;

  referencia?: {
    tipo: 'VENTA' | 'TRANSFERENCIA' | 'AJUSTE' | 'COMPRA' | 'ANULACION';
    id: Types.ObjectId;
  };

  observacion?: string;
  fecha: Date;
  createdAt: Date;
}

const movimientoSchema = new Schema<Movimiento>(
  {
    tipoMovimiento: {
      type: String,
      enum: Object.values(TIPO_MOVIMIENTO),
      required: true,
    },
    subtipoMovimiento: {
      type: String,
      enum: Object.values(SUBTIPO_MOVIMIENTO),
      required: true,
    },
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
      min: 1,
    },
    saldoAnterior: {
      type: Number,
      required: true,

    },
    saldoPosterior: {
      type: Number,
      required: true,

    },
    referencia: {
      tipo: {
        type: String,
        enum: ['VENTA', 'TRANSFERENCIA', 'AJUSTE', 'COMPRA', 'ANULACIÓN'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    observacion: {
      type: String,
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const MovimientoModel = model<Movimiento>(
  'Movimiento',
  movimientoSchema
);
