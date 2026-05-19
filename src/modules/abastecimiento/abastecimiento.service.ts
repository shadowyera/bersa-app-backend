import mongoose from 'mongoose'
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

export const registrarIngresoStock = async (
  input: CrearIngresoStockInput
) => {

  const session = await mongoose.startSession()

  try {

    session.startTransaction()

    const {
      sucursalDestinoId,
      items,
      observacion,
      createdBy,
    } = input

    if (!items || items.length === 0) {
      throw new Error('Debe ingresar al menos un producto')
    }

    /* ================================
       1. Validar items
    ================================ */

    const itemsSnapshot = items.map((item) => {

      if (!item.productoId) {
        throw new Error('productoId es obligatorio')
      }

      if (!item.cantidad || item.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0')
      }

      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        proveedorId: item.proveedorId,
        proveedorNombre: item.proveedorNombre,
      }

    })

    /* ================================
       2. Crear abastecimiento
    ================================ */

    const [abastecimiento] = await AbastecimientoModel.create(
      [
        {
          tipo: TIPO_ABASTECIMIENTO.INGRESO_STOCK,
          sucursalDestinoId,
          observacion,
          createdBy,
          items: itemsSnapshot,
        },
      ],
      { session }
    )

    /* ================================
       3. Registrar movimientos
    ================================ */

    for (const item of itemsSnapshot) {

      const esCompraProveedor =
        Boolean(item.proveedorId)

      await registrarMovimiento(
        {
          tipoMovimiento: TIPO_MOVIMIENTO.INGRESO,

          subtipoMovimiento: esCompraProveedor
            ? SUBTIPO_MOVIMIENTO.COMPRA_PROVEEDOR
            : SUBTIPO_MOVIMIENTO.AJUSTE_ADMIN,

          productoId: item.productoId,

          sucursalId: sucursalDestinoId,

          cantidad: item.cantidad,

          referencia: {
            tipo: REFERENCIA_MOVIMIENTO.ABASTECIMIENTO,
            id: abastecimiento._id,
          },

          observacion,
        },
        session
      )

    }

    await session.commitTransaction()

    return abastecimiento

  } catch (error) {

    await session.abortTransaction()
    throw error

  } finally {

    session.endSession()

  }
}