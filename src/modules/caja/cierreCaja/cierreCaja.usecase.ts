import { Types } from 'mongoose'
import { cerrarCajaAutomatico } from './cierreCaja.service'
import { emitRealtimeEvent } from '../../realtime/realtime.service'

export const cerrarCajaAutomaticoApp = async ({
  cajaId,
  usuarioId,
  rol,
  montoFinal,
  sucursalId,
  usuarioNombre,
}: {
  cajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  rol: 'ADMIN' | 'ENCARGADO' | 'CAJERO' | 'BODEGUERO'
  montoFinal: number
  sucursalId: Types.ObjectId
  usuarioNombre: string
}) => {
  const resultado = await cerrarCajaAutomatico({
    cajaId,
    usuarioId,
    rol,
    montoFinal,
  })

  emitRealtimeEvent({
    type: 'CAJA_CERRADA',
    sucursalId: sucursalId.toString(),
    cajaId: cajaId.toString(),

    origenUsuarioId: usuarioId.toString(),
    origenUsuarioNombre: usuarioNombre,
  })

  return resultado
}