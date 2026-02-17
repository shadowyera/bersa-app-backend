import { Schema, model, Types } from 'mongoose'

export enum ESTADO_APERTURA_CAJA {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export interface AperturaCaja {
  _id: Types.ObjectId

  cajaId: Types.ObjectId
  sucursalId: Types.ObjectId

  usuarioAperturaId: Types.ObjectId   // quién abrió
  usuarioCierreId?: Types.ObjectId

  fechaApertura: Date
  montoInicial: number

  fechaCierre?: Date
  montoFinal?: number
  diferencia?: number

  /** 🔥 NUEVO */
  motivoDiferencia?: string

  estado: ESTADO_APERTURA_CAJA
}

const aperturaCajaSchema = new Schema<AperturaCaja>(
  {
    cajaId: {
      type: Schema.Types.ObjectId,
      ref: 'Caja',
      required: true,
      index: true,
    },

    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    usuarioAperturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },

    usuarioCierreId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    fechaApertura: {
      type: Date,
      default: Date.now,
    },

    montoInicial: {
      type: Number,
      required: true,
      min: 0,
    },

    fechaCierre: {
      type: Date,
    },

    montoFinal: {
      type: Number,
      min: 0,
    },

    diferencia: {
      type: Number,
    },

    motivoDiferencia: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    estado: {
      type: String,
      enum: Object.values(ESTADO_APERTURA_CAJA),
      default: ESTADO_APERTURA_CAJA.ABIERTA,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// 🔒 Una sola apertura ABIERTA por caja
aperturaCajaSchema.index(
  { cajaId: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'ABIERTA' } }
)

export const AperturaCajaModel = model<AperturaCaja>(
  'AperturaCaja',
  aperturaCajaSchema
)