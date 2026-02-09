import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../aperturaCaja/aperturaCaja.model'

interface UsuarioPopulate {
  _id: Types.ObjectId
  nombre: string
}

export async function getAperturasActivas(
  sucursalId: string
) {
  const aperturas = await AperturaCajaModel.find({
    sucursalId: new Types.ObjectId(sucursalId),
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })
    .populate('usuarioAperturaId', 'nombre')
    .select({
      _id: 1,
      cajaId: 1,
      sucursalId: 1,
      usuarioAperturaId: 1,
      fechaApertura: 1,
      montoInicial: 1,
      estado: 1,
    })
    .lean()

  return aperturas.map(a => {
    const usuario =
      typeof a.usuarioAperturaId === 'object' &&
      a.usuarioAperturaId !== null &&
      'nombre' in a.usuarioAperturaId
        ? (a.usuarioAperturaId as UsuarioPopulate)
        : null

    return {
      id: String(a._id),
      cajaId: String(a.cajaId),
      sucursalId: String(a.sucursalId),
      usuarioAperturaId: usuario
        ? String(usuario._id)
        : String(a.usuarioAperturaId),
      usuarioAperturaNombre: usuario?.nombre,
      fechaApertura: a.fechaApertura,
      montoInicial: a.montoInicial,
      estado: a.estado,
    }
  })
}