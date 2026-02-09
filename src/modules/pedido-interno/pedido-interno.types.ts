/* =====================================================
   Estados del pedido interno (RUNTIME + TYPE)
===================================================== */

/**
 * Estados posibles de un Pedido Interno.
 *
 * Flujo normal:
 * - CREADO → PREPARADO → DESPACHADO
 *
 * Flujo alternativo:
 * - CREADO → CANCELADO
 */
export const ESTADO_PEDIDO_INTERNO = {
  CREADO: 'CREADO',
  PREPARADO: 'PREPARADO',
  DESPACHADO: 'DESPACHADO',
  CANCELADO: 'CANCELADO',
} as const

export type EstadoPedidoInterno =
  (typeof ESTADO_PEDIDO_INTERNO)[keyof typeof ESTADO_PEDIDO_INTERNO]

/* =====================================================
   Item de Pedido Interno (SNAPSHOT HISTÓRICO)
===================================================== */

/**
 * Item solicitado por una sucursal.
 *
 * Importante:
 * - NO usa populate
 * - El producto se guarda como snapshot
 * - El nombre y unidad NO vienen desde Producto
 */
export interface PedidoInternoItem {
  /** Referencia técnica al producto */
  productoId: string

  /** Snapshot histórico */
  productoNombre: string
  unidadBase: string

  /** Cantidad solicitada en la unidad pedida */
  cantidadSolicitada: number

  /** Unidad en que se solicita (ej: CAJA, UNIDAD) */
  unidadPedido: string

  /** Factor de conversión a unidad base */
  factorUnidad: number

  /** Cantidad solicitada expresada en unidad base */
  cantidadBaseSolicitada: number

  /**
   * Cantidad realmente preparada por bodega.
   * - Puede ser menor
   * - Puede ser 0
   * - Puede no existir
   */
  cantidadPreparada?: number
}

/* =====================================================
   Documento Pedido Interno (LECTURA)
===================================================== */

/**
 * Pedido interno entre sucursales.
 *
 * Reglas de dominio:
 * - Se crea en la sucursal solicitante
 * - Es editable solo en estado CREADO
 * - La bodega decide cuánto prepara
 * - El despacho define la realidad final
 */
export interface PedidoInterno {
  id: string

  /** Sucursal que solicita el pedido */
  sucursalSolicitanteId: string

  /** Sucursal que abastece (normalmente MAIN) */
  sucursalAbastecedoraId: string

  estado: EstadoPedidoInterno

  items: PedidoInternoItem[]

  createdAt: string
  updatedAt: string
}

export interface PedidoPreparacionDTO {
  pedidoId: string
  estado: EstadoPedidoInterno

  filtros: {
    categorias: {
      id: string
      nombre: string
    }[]
    proveedores: {
      id: string
      nombre: string
    }[]
  }

  items: {
    productoId: string
    productoNombre: string

    categoriaId: string
    categoriaNombre: string

    proveedorId: string
    proveedorNombre: string

    cantidadSolicitada: number
    unidadPedido: string

    cantidadPreparada?: number
  }[]
}