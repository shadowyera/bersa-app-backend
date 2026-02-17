import { Schema, model, Types } from 'mongoose'

export interface Receptor {
  rut: string
  razonSocial: string
  giro?: string
  direccion?: string
  comuna?: string
  ciudad?: string
}

export interface FacturaItem {
  productoId?: Types.ObjectId
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Factura {
  _id: Types.ObjectId
  ventaId: Types.ObjectId
  tipoDocumento: 'FACTURA'
  folio: string
  receptor: Receptor
  items: FacturaItem[]
  neto: number
  iva: number
  total: number
  estado: 'PENDIENTE' | 'EMITIDA' | 'ANULADA'
  metadataSii?: any
  createdAt: Date
}

const facturaItemSchema = new Schema<FacturaItem>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: false
    },
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const receptorSchema = new Schema<Receptor>(
  {
    rut: { type: String, required: true, index: true },
    razonSocial: { type: String, required: true },
    giro: { type: String },
    direccion: { type: String },
    comuna: { type: String },
    ciudad: { type: String }
  },
  { _id: false }
)

const facturaSchema = new Schema<Factura>(
  {
    ventaId: {
      type: Schema.Types.ObjectId,
      ref: 'Venta',
      required: true,
      index: true
    },
    tipoDocumento: { type: String, enum: ['FACTURA'], default: 'FACTURA' },
    folio: { type: String, required: true, index: true },
    receptor: { type: receptorSchema, required: true },
    items: { type: [facturaItemSchema], required: true, validate: [(items: FacturaItem[]) => items.length > 0, 'La factura debe tener items'] },
    neto: { type: Number, required: true, min: 0 },
    iva: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ['PENDIENTE', 'EMITIDA', 'ANULADA'], default: 'PENDIENTE', index: true },
    metadataSii: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const FacturaModel = model<Factura>('Factura', facturaSchema)