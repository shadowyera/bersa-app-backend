import { Types } from 'mongoose'

export interface CrearFacturaItemInput {
  productoId?: string
  descripcion: string
  cantidad: number
  precioUnitario: number
}

export interface ReceptorInput {
  rut: string
  razonSocial: string
  giro?: string
  direccion?: string
  comuna?: string
  ciudad?: string
}

export interface CrearFacturaInput {
  ventaId: string
  receptor: ReceptorInput
  items?: CrearFacturaItemInput[]
  aplicarIva?: boolean
  ivaRate?: number
}

export interface FacturaResponse {
  _id: string
  ventaId: string
  tipoDocumento: 'FACTURA'
  folio: string
  receptor: ReceptorInput
  items: CrearFacturaItemInput[]
  neto: number
  iva: number
  total: number
  estado: 'PENDIENTE' | 'EMITIDA' | 'ANULADA'
  createdAt: string
}