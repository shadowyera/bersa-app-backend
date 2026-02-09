/* =====================================================
   Despacho Interno — Types 2026
   -----------------------------------------------------
   Representa un despacho físico entre sucursales.
   Puede originarse desde pedidos o directamente
   desde bodega, y puede incluir items suplentes.
===================================================== */

/* =====================================================
   Estado del Despacho
===================================================== */

/**
 * Flujo administrativo simple:
 * - CREADO     → despacho en preparación
 * - DESPACHADO → despacho ejecutado (cerrado)
 */
export const ESTADO_DESPACHO_INTERNO = {
  CREADO: 'CREADO',
  DESPACHADO: 'DESPACHADO',
} as const

export type EstadoDespachoInterno =
  (typeof ESTADO_DESPACHO_INTERNO)[keyof typeof ESTADO_DESPACHO_INTERNO]

/* =====================================================
   Origen del Despacho
===================================================== */

/**
 * Define desde dónde nace el despacho.
 *
 * PEDIDO:
 * - Cierre administrativo de uno o más PedidoInterno
 *
 * DIRECTO:
 * - Despacho operativo sin pedido previo
 * - Ej: olvido, urgencia, producto nuevo
 */
export const ORIGEN_DESPACHO_INTERNO = {
  PEDIDO: 'PEDIDO',
  DIRECTO: 'DIRECTO',
} as const

export type OrigenDespachoInterno =
  (typeof ORIGEN_DESPACHO_INTERNO)[keyof typeof ORIGEN_DESPACHO_INTERNO]

/* =====================================================
   Origen del Item dentro del Despacho
===================================================== */

/**
 * Indica por qué el item está en el despacho.
 *
 * PEDIDO:
 * - Venía solicitado en el pedido original
 *
 * SUPLENTE:
 * - Agregado por bodega para suplir otro producto
 */
export const ORIGEN_ITEM_DESPACHO = {
  PEDIDO: 'PEDIDO',
  SUPLENTE: 'SUPLENTE',
} as const

export type OrigenItemDespacho =
  (typeof ORIGEN_ITEM_DESPACHO)[keyof typeof ORIGEN_ITEM_DESPACHO]

/* =====================================================
   Snapshot de Item Despachado
===================================================== */

/**
 * Representa un producto que efectivamente salió
 * de bodega en este despacho.
 *
 * Es inmutable y no se recalcula.
 */
export interface DespachoItemSnapshot {
  productoId: string
  productoNombre: string

  /**
   * Cantidad despachada
   * (unidad base del producto)
   */
  cantidad: number

  /**
   * PEDIDO   → solicitado originalmente
   * SUPLENTE → agregado por bodega
   */
  origenItem: OrigenItemDespacho
}

/* =====================================================
   Snapshot de Pedido Interno (solo origen PEDIDO)
===================================================== */

/**
 * Snapshot histórico del pedido al momento del despacho.
 *
 * Importante:
 * - No referencia al pedido vivo
 * - No se enriquece
 * - Solo lectura
 */
export interface DespachoPedidoSnapshot {
  pedidoInternoId: string
  numeroPedido: string

  /**
   * Sucursal que recibe este pedido
   */
  sucursalDestinoId: string

  /**
   * Items despachados para ESTE pedido
   * (incluye PEDIDO y SUPLENTE)
   */
  items: DespachoItemSnapshot[]
}

/* =====================================================
   Documento Despacho Interno
===================================================== */

/**
 * Documento principal de despacho interno.
 *
 * Reglas:
 * - Siempre tiene origen
 * - PEDIDO → usa "pedidos"
 * - DIRECTO → usa "itemsDirectos"
 * - Nunca ambos a la vez
 */
export interface DespachoInterno {
  _id: string

  /**
   * Origen del despacho
   */
  origen: OrigenDespachoInterno

  /**
   * Sucursal que despacha
   */
  sucursalOrigenId: string

  /**
   * Pedidos incluidos
   * (solo si origen === PEDIDO)
   */
  pedidos?: DespachoPedidoSnapshot[]

  /**
   * Items despachados directamente
   * (solo si origen === DIRECTO)
   */
  itemsDirectos?: DespachoItemSnapshot[]

  /**
   * Estado administrativo
   */
  estado: EstadoDespachoInterno

  /**
   * Auditoría
   */
  creadoPorId: string
  creadoEn: string

  /**
   * Fecha efectiva del despacho
   */
  despachadoEn?: string
}