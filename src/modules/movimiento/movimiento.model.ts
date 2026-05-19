import { Schema, model, Types } from 'mongoose'

/* =====================================================
   DIRECCIÓN DEL MOVIMIENTO
===================================================== */

export enum TIPO_MOVIMIENTO {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

/* =====================================================
   SUBTIPO (MOTIVO DE NEGOCIO)
===================================================== */

export enum SUBTIPO_MOVIMIENTO {

  /* =====================
     INGRESOS
  ===================== */

  COMPRA_PROVEEDOR = 'COMPRA_PROVEEDOR',
  TRANSFERENCIA_RECEPCION = 'TRANSFERENCIA_RECEPCION',
  ANULACION_VENTA_POS = 'ANULACION_VENTA_POS',
  AJUSTE_ADMIN = 'AJUSTE_ADMIN',

  /* =====================
     EGRESOS
  ===================== */

  VENTA_POS = 'VENTA_POS',
  TRANSFERENCIA_ENVIO = 'TRANSFERENCIA_ENVIO',
}

/* =====================================================
   REFERENCIA FUNCIONAL
===================================================== */

export enum REFERENCIA_MOVIMIENTO {
  VENTA = 'VENTA',
  ABASTECIMIENTO = 'ABASTECIMIENTO',
  AJUSTE = 'AJUSTE',
  DESPACHO_INTERNO = 'DESPACHO_INTERNO',
  ANULACION = 'ANULACION',
}

/* =====================================================
   INTERFACE
===================================================== */

export interface Movimiento {
  _id: Types.ObjectId

  /** Dirección */
  tipoMovimiento: TIPO_MOVIMIENTO

  /** Motivo del negocio */
  subtipoMovimiento: SUBTIPO_MOVIMIENTO

  /** Producto afectado */
  productoId: Types.ObjectId

  /** Sucursal */
  sucursalId: Types.ObjectId

  /**
   * Cantidad SIEMPRE positiva.
   * El signo lo define tipoMovimiento.
   */
  cantidad: number

  /** Stock antes del movimiento */
  saldoAnterior: number

  /** Stock después del movimiento */
  saldoPosterior: number

  /** Referencia funcional */
  referencia?: {
    tipo: REFERENCIA_MOVIMIENTO
    id: Types.ObjectId
  }

  /** Observación libre */
  observacion?: string

  /** Fecha efectiva del movimiento */
  fecha: Date

  /** Auditoría técnica */
  createdAt: Date
}

/* =====================================================
   SCHEMA
===================================================== */

const MovimientoSchema = new Schema<Movimiento>(
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
    },

    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
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
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

/* =====================================================
   ÍNDICES IMPORTANTES (KARDEX)
===================================================== */

/**
 * Kardex por producto dentro de una sucursal
 * consulta típica:
 * productoId + sucursalId + orden cronológico
 */
MovimientoSchema.index({
  productoId: 1,
  sucursalId: 1,
  fecha: -1,
})

/**
 * Movimientos por sucursal
 * usado para reportes y auditoría
 */
MovimientoSchema.index({
  sucursalId: 1,
  fecha: -1,
})

/**
 * Listado global de movimientos
 */
MovimientoSchema.index({
  fecha: -1,
})

/**
 * Filtro por tipo de movimiento
 */
MovimientoSchema.index({
  tipoMovimiento: 1,
  fecha: -1,
})

/* =====================================================
   MODEL
===================================================== */

export const MovimientoModel = model<Movimiento>(
  'Movimiento',
  MovimientoSchema
)