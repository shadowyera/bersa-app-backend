import {
  CrearIngresoStockInput,
  TIPO_ABASTECIMIENTO,
} from './abastecimiento.types'
import { AbastecimientoModel } from './abastecimiento.model'
import {
  registrarMovimiento,
} from '../movimiento/movimiento.service'
import {
  TIPO_MOVIMIENTO,
  SUBTIPO_MOVIMIENTO,
  REFERENCIA_MOVIMIENTO,
} from '../movimiento/movimiento.model'

/**
 * INGRESO DE STOCK (2026)
 *
 * Reglas:
 * - NO existe proveedorId global
 * - El proveedor es snapshot por item
 * - 1 abastecimiento → N movimientos
 */
export const registrarIngresoStock = async (
  input: CrearIngresoStockInput
) => {
  const {
    sucursalDestinoId,
    items,
    observacion,
    createdBy,
  } = input

  if (!items || items.length === 0) {
    throw new Error(
      'Debe ingresar al menos un producto'
    )
  }

  /* ================================
     1. Normalizar items (snapshot)
  ================================ */

  const itemsSnapshot = items.map(item => {
    if (item.cantidad <= 0) {
      throw new Error(
        'La cantidad debe ser mayor a 0'
      )
    }

    return {
      productoId: item.productoId,
      cantidad: item.cantidad,

      // 👇 SNAPSHOT DE PROVEEDOR (CLAVE)
      proveedorId: item.proveedorId,
      proveedorNombre: item.proveedorNombre,
    }
  })

  /* ================================
     2. Crear abastecimiento
  ================================ */

  const abastecimiento =
    await AbastecimientoModel.create({
      tipo: TIPO_ABASTECIMIENTO.INGRESO_STOCK,
      sucursalDestinoId,
      observacion,
      createdBy,
      items: itemsSnapshot,
    })

  /* ================================
     3. Registrar movimientos (kardex)
  ================================ */

  for (const item of itemsSnapshot) {
    const esCompraProveedor =
      Boolean(item.proveedorId)

    await registrarMovimiento({
      tipoMovimiento: TIPO_MOVIMIENTO.INGRESO,
      subtipoMovimiento: esCompraProveedor
        ? SUBTIPO_MOVIMIENTO.COMPRA_PROVEEDOR
        : SUBTIPO_MOVIMIENTO.AJUSTE_POSITIVO,

      productoId: item.productoId,
      sucursalId: sucursalDestinoId,
      cantidad: item.cantidad,

      referencia: {
        tipo: esCompraProveedor
          ? REFERENCIA_MOVIMIENTO.COMPRA
          : REFERENCIA_MOVIMIENTO.AJUSTE,
        id: abastecimiento._id,
      },

      observacion,
    })
  }

  return abastecimiento
}