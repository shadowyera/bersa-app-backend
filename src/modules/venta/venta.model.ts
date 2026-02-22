import { Schema, model, Types } from 'mongoose'

/* =====================================================
   TIPOS DE DOMINIO
===================================================== */

/**
 * Item individual dentro de una venta.
 * Snapshot del precio al momento de vender.
 */
export interface VentaItem {
  productoId: Types.ObjectId
  cantidad: number
  precioUnitario: number
  subtotal: number
}

/**
 * Datos del receptor cuando el documento es FACTURA.
 * Se almacenan como snapshot histórico.
 */
export interface DocumentoReceptor {
  rut: string
  razonSocial: string
  giro: string
  direccion: string
  comuna: string
  ciudad: string
}

/**
 * Información tributaria básica del documento.
 * NO representa emisión electrónica.
 */
export interface DocumentoTributario {
  tipo: 'BOLETA' | 'FACTURA'
  receptor?: DocumentoReceptor
  requiereEmisionSii: boolean
}

/**
 * Entidad principal Venta (Nivel POS).
 */
export interface Venta {
  _id: Types.ObjectId

  // 🔥 NUEVO
  folio: string

  sucursalId: Types.ObjectId
  cajaId: Types.ObjectId
  aperturaCajaId: Types.ObjectId
  usuarioId: Types.ObjectId

  numeroVenta: number

  items: VentaItem[]

  total: number
  ajusteRedondeo: number
  totalCobrado: number

  estado: 'ABIERTA' | 'FINALIZADA' | 'ANULADA'

  documentoTributario: DocumentoTributario

  createdAt: Date
}

/* =====================================================
   SUBSCHEMAS
===================================================== */

const ventaItemSchema = new Schema<VentaItem>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },

    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },

    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
)

const documentoReceptorSchema = new Schema<DocumentoReceptor>(
  {
    rut: {
      type: String,
      required: true,
      trim: true,
    },

    razonSocial: {
      type: String,
      required: true,
      trim: true,
    },

    giro: {
      type: String,
      required: true,
      trim: true,
    },

    direccion: {
      type: String,
      required: true,
      trim: true,
    },

    comuna: {
      type: String,
      required: true,
      trim: true,
    },

    ciudad: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
)

const documentoTributarioSchema = new Schema<DocumentoTributario>(
  {
    tipo: {
      type: String,
      enum: ['BOLETA', 'FACTURA'],
      required: true,
      default: 'BOLETA',
      index: true,
    },

    receptor: {
      type: documentoReceptorSchema,
      required: false,
    },

    /**
     * Flag semántico:
     * - true  => esta venta debe ser enviada al SII en el futuro
     * - false => nunca se enviará (boleta simple POS)
     */
    requiereEmisionSii: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    _id: false,
  }
)

/* =====================================================
   SCHEMA PRINCIPAL
===================================================== */

const ventaSchema = new Schema<Venta>(
  {
    // 🔥 NUEVO
    folio: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    sucursalId: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    cajaId: {
      type: Schema.Types.ObjectId,
      ref: 'Caja',
      required: true,
      index: true,
    },

    aperturaCajaId: {
      type: Schema.Types.ObjectId,
      ref: 'AperturaCaja',
      required: true,
      index: true,
    },

    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    numeroVenta: {
      type: Number,
      required: true,
      index: true,
    },

    items: {
      type: [ventaItemSchema],
      required: true,
      validate: [
        (items: VentaItem[]) => items.length > 0,
        'La venta debe tener al menos un item',
      ],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    ajusteRedondeo: {
      type: Number,
      required: true,
      default: 0,
    },

    totalCobrado: {
      type: Number,
      required: true,
      min: 0,
    },

    estado: {
      type: String,
      enum: ['ABIERTA', 'FINALIZADA', 'ANULADA'],
      default: 'FINALIZADA',
      index: true,
    },

    documentoTributario: {
      type: documentoTributarioSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

/* =====================================================
   MODEL
===================================================== */

export const VentaModel = model<Venta>(
  'Venta',
  ventaSchema
)