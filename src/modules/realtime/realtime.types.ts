/**
 * Tipos de eventos en tiempo real
 * Importante:
 * - Son CONTRATOS frontend ↔ backend
 * - No deben romperse sin versionado
 */
export type RealtimeEventType =
  // 🧾 Caja
  | 'CAJA_ABIERTA'
  | 'CAJA_CERRADA'

  // 📦 Catálogo
  | 'PRODUCTO_CREATED'
  | 'PRODUCTO_UPDATED'
  | 'PRODUCTO_DELETED'

  // 📝 Pedidos internos
  | 'PEDIDO_CREATED'
  | 'PEDIDO_UPDATED'
  | 'PEDIDO_PREPARADO'
  | 'PEDIDO_DESPACHADO'

  // 🚚 Despachos
  | 'DESPACHO_CREATED'
  | 'DESPACHO_UPDATED'
  | 'DESPACHO_CERRADO'

export interface RealtimeEventPayload {
  type: RealtimeEventType

  /**
   * - sucursalId real → eventos operativos
   * - 'GLOBAL' → catálogos / maestros
   */
  sucursalId: string

  // IDs relacionados (según evento)
  cajaId?: string
  aperturaCajaId?: string

  pedidoId?: string
  despachoId?: string

  productoId?: string

  /**
   * Usuario que originó el evento
   * - Permite al frontend ignorar eco
   */
  origenUsuarioId?: string
  origenUsuarioNombre?: string
}