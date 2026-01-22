/* =====================================================
   Estados de despacho interno
===================================================== */

/**
 * Estados posibles de un Despacho Interno.
 *
 * Flujo normal:
 * - DESPACHADO → RECIBIDO
 *
 * Notas:
 * - El kardex registra el movimiento físico de stock.
 * - El estado del despacho representa el ciclo logístico.
 */
export const ESTADO_DESPACHO_INTERNO = {
  /** Despacho enviado desde sucursal origen */
  DESPACHADO: 'DESPACHADO',

  /** Despacho recibido en sucursal destino */
  RECIBIDO: 'RECIBIDO',

  /**
   * Despacho anulado por error administrativo.
   * No debe generar movimientos adicionales de stock.
   */
  ANULADO: 'ANULADO',
} as const

export type EstadoDespachoInterno =
  (typeof ESTADO_DESPACHO_INTERNO)[keyof typeof ESTADO_DESPACHO_INTERNO]

/* =====================================================
   Item despachado
===================================================== */

export interface DespachoInternoItem {
  productoId: string

  /** Cantidad enviada en la unidad indicada */
  cantidadDespachada: number

  /** Unidad usada para el despacho (ej: CAJA, UNIDAD) */
  unidadPedido: string

  /** Factor de conversión a unidad base */
  factorUnidad: number

  /** Cantidad enviada en unidad base */
  cantidadBaseDespachada: number
}

/* =====================================================
   Documento despacho interno
===================================================== */

export interface DespachoInterno {
  id: string

  /**
   * Pedido interno asociado (opcional).
   * Puede no existir en despachos manuales o urgentes.
   */
  pedidoInternoId?: string | null

  /** Sucursal que envía (normalmente MAIN) */
  sucursalOrigenId: string

  /** Sucursal que recibe */
  sucursalDestinoId: string

  /** Estado logístico del despacho */
  estado: EstadoDespachoInterno

  items: DespachoInternoItem[]

  /** Observación ingresada al despachar o recibir */
  observacion?: string | null

  createdAt: string
  updatedAt: string
}