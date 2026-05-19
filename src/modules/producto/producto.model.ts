import { Schema, model, Document } from 'mongoose'

/* ======================================================
   Interfaces
====================================================== */

interface Presentacion {
  nombre: string
  unidades: number
  codigoBarra?: string
  vendible?: boolean
  precio?: number
}

interface ReglaPrecio {
  cantidadMinima: number
  precioUnitario: number
}

export interface Producto extends Document {
  nombre: string
  descripcion?: string
  precio: number

  categoriaId?: Schema.Types.ObjectId
  proveedorId?: Schema.Types.ObjectId

  activo: boolean
  unidadBase: string

  unidadLogistica?: {
    unidadPedido: string
    factorUnidad: number
    etiquetaVisible: string
  }

  presentaciones: Presentacion[]
  reglasPrecio: ReglaPrecio[]

  fechaVencimiento?: Date
  imagenUrl?: string
  codigo?: string
}

/* ======================================================
   Schema
====================================================== */

const productoSchema = new Schema<Producto>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      default: '',
    },

    precio: {
      type: Number,
      required: true,
      min: 0,
    },

    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
    },

    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Proveedor',
      default: null,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    unidadBase: {
      type: String,
      required: true,
      default: 'unidad',
    },

    unidadLogistica: {
      unidadPedido: {
        type: String,
        enum: ['UNIDAD', 'PAQUETE', 'CAJA', 'MANGA', 'SACO'],
        default: 'UNIDAD',
      },

      factorUnidad: {
        type: Number,
        default: 1,
        min: 1,
      },

      etiquetaVisible: {
        type: String,
        default: 'unidad',
      },
    },

    presentaciones: [
      {
        nombre: {
          type: String,
          required: true,
        },

        unidades: {
          type: Number,
          required: true,
        },

        codigoBarra: String,

        vendible: {
          type: Boolean,
          default: false,
        },

        precio: Number,
      },
    ],

    reglasPrecio: [
      {
        cantidadMinima: Number,
        precioUnitario: Number,
      },
    ],

    fechaVencimiento: Date,

    imagenUrl: String,

    codigo: {
      type: String,
      unique: true,
      sparse: true, // permite null sin romper unique
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

/* ======================================================
   Model
====================================================== */

const ProductoModel = model<Producto>('Producto', productoSchema)

export default ProductoModel