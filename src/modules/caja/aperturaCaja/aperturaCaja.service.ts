import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from './aperturaCaja.model'

interface UsuarioPopulate {
  _id: Types.ObjectId
  nombre: string
  email?: string
}

/**
 * Abre una caja (crea una apertura)
 * DOMINIO PURO
 */
export const abrirCaja = async ({
  cajaId,
  sucursalId,
  usuarioId,
  montoInicial,
}: {
  cajaId: Types.ObjectId
  sucursalId: Types.ObjectId
  usuarioId: Types.ObjectId
  montoInicial: number
}) => {
  if (montoInicial < 0) {
    throw new Error(
      'El monto inicial no puede ser negativo'
    )
  }

  const aperturaActiva =
    await AperturaCajaModel.findOne({
      cajaId,
      estado: ESTADO_APERTURA_CAJA.ABIERTA,
    })

  if (aperturaActiva) {
    throw new Error(
      'La caja ya tiene una apertura activa'
    )
  }

  const apertura =
    await AperturaCajaModel.create({
      cajaId,
      sucursalId,
      usuarioAperturaId: usuarioId,
      montoInicial,
    })

  return apertura
}

/**
 * Devuelve la apertura activa de una caja
 *
 * ✔️ Dominio intacto
 * ✔️ Usuario poblado
 * ✔️ DTO listo para UI
 */
export const getAperturaActiva = async (
  cajaId: Types.ObjectId
) => {
  const apertura =
    await AperturaCajaModel.findOne({
      cajaId,
      estado: ESTADO_APERTURA_CAJA.ABIERTA,
    })
      .populate(
        'usuarioAperturaId',
        'nombre email'
      )
      .lean()

  if (!apertura) return null

  return {
    ...apertura,
    usuarioAperturaNombre:
      isUsuarioPopulate(
        apertura.usuarioAperturaId
      )
        ? apertura.usuarioAperturaId.nombre
        : undefined,
  }
  function isUsuarioPopulate(
    value: any
  ): value is UsuarioPopulate {
    return (
      value &&
      typeof value === 'object' &&
      'nombre' in value
    )
  }
}
