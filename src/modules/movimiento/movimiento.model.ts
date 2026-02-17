import { Schema, model, Types } from 'mongoose'

/* =====================================================
   Tipos de Movimiento (Kardex)
===================================================== */

export enum TIPO_MOVIMIENTO {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

export enum SUBTIPO_MOVIMIENTO {
  /* =====================
     INGRESOS
  ===================== */

  COMPRA_PROVEEDOR = 'COMPRA_PROVEEDOR',
  TRANSFERENCIA_RECEPCION = 'TRANSFERENCIA_RECEPCION',
  AJUSTE_POSITIVO = 'AJUSTE_POSITIVO',

  /** 🔁 Ingreso por anulación de venta POS */
  ANULACION_VENTA_POS = 'ANULACION_VENTA_POS',

  /* =====================
     EGRESOS
  ===================== */

  VENTA_POS = 'VENTA_POS',
  TRANSFERENCIA_ENVIO = 'TRANSFERENCIA_ENVIO',
  AJUSTE_NEGATIVO = 'AJUSTE_NEGATIVO',
}

/* =====================================================
   Referencias posibles del movimiento
===================================================== */

export enum REFERENCIA_MOVIMIENTO {
  VENTA = 'VENTA',
  COMPRA = 'COMPRA',
  AJUSTE = 'AJUSTE',
  DESPACHO_INTERNO = 'DESPACHO_INTERNO',
  ANULACION = 'ANULACION',
}

/* =====================================================
   Interface
===================================================== */

export interface Movimiento {
  _id: Types.ObjectId

  /** Naturaleza del movimiento */
  tipoMovimiento: TIPO_MOVIMIENTO
  subtipoMovimiento: SUBTIPO_MOVIMIENTO

  /** Producto afectado (unidad base) */
  productoId: Types.ObjectId

  /** Sucursal donde ocurre el movimiento */
  sucursalId: Types.ObjectId

  /**
   * Cantidad movida (SIEMPRE positiva, unidad base)
   * El signo lo define tipoMovimiento
   */
  cantidad: number

  /** Stock antes del movimiento */
  saldoAnterior: number

  /** Stock después del movimiento */
  saldoPosterior: number

  /**
   * Referencia administrativa / funcional
   */
  referencia?: {
    tipo: REFERENCIA_MOVIMIENTO
    id: Types.ObjectId
  }

  /** Observación libre */
  observacion?: string

  /**
   * Fecha efectiva del movimiento físico
   */
  fecha: Date

  /** Auditoría técnica */
  createdAt: Date
}

/* =====================================================
   Schema
===================================================== */

const MovimientoSchema = new Schema<Movimiento>(
  {
    tipoMovimiento: {
      type: String,
      enum: Object.values(TIPO_MOVIMIENTO),
      required: true,
      index: true,
    },

    subtipoMovimiento: {
      type: String,
      enum: Object.values(SUBTIPO_MOVIMIENTO),
      required: true,
      index: true,
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
        enum: Object.values(REFERENCIA_MOVIMIENTO),
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },

    observacion: {
      type: String,
      trim: true,
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
)

/* =====================================================
   Model
===================================================== */

export const MovimientoModel = model<Movimiento>(
  'Movimiento',
  MovimientoSchema
)