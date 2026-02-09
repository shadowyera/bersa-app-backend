/**
 * Reglas de dominio relacionadas al stock por sucursal
 */

export interface StockConProducto {
  habilitado: boolean
  productoId?: {
    activo: boolean
  }
}

/**
 * Determina si un producto puede ser solicitado en un pedido interno
 */
export function isProductoHabilitadoParaPedido(
  stock: StockConProducto
): boolean {
  return (
    stock.habilitado === true &&
    stock.productoId?.activo === true
  )
}