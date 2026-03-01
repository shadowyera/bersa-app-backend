import mongoose, { Types } from 'mongoose'
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
        productoId: new Types.ObjectId(item.productoId),
        cantidad: item.cantidad,
        proveedorId: item.proveedorId
          ? new Types.ObjectId(item.proveedorId)
          : undefined,
        proveedorNombre: item.proveedorNombre,
      }
    })

    /* ================================
       2. Crear abastecimiento
    ================================ */

    const abastecimiento = await AbastecimientoModel.create(
      [
        {
          tipo: TIPO_ABASTECIMIENTO.INGRESO_STOCK,
          sucursalDestinoId: new Types.ObjectId(sucursalDestinoId),
          observacion,
          createdBy: new Types.ObjectId(createdBy),
          items: itemsSnapshot,
        },
      ],
      { session }
    )

    const abastecimientoId = abastecimiento[0]._id

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
          sucursalId: new Types.ObjectId(sucursalDestinoId),
          cantidad: item.cantidad,

          referencia: {
            tipo: REFERENCIA_MOVIMIENTO.ABASTECIMIENTO,
            id: abastecimientoId,
          },

          observacion,
        },
        session
      )
    }

    /* ================================
       4. Commit
    ================================ */

    await session.commitTransaction()
    session.endSession()

    return abastecimiento[0]

  } catch (error) {

    await session.abortTransaction()
    session.endSession()

    throw error
  }
}