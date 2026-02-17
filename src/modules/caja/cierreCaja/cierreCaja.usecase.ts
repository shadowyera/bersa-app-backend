import { Types } from 'mongoose'
import { cerrarCajaAutomatico } from './cierreCaja.service'
import { emitRealtimeEvent } from '../../realtime/realtime.service'

export const cerrarCajaAutomaticoApp = async ({
  cajaId,
  usuarioId,
  rol,
  montoFinal,
  motivoDiferencia,
  sucursalId,
  usuarioNombre,
}: {
  cajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  rol: 'ADMIN' | 'ENCARGADO' | 'CAJERO' | 'BODEGUERO'
  montoFinal: number
  motivoDiferencia?: string
  sucursalId: Types.ObjectId
  usuarioNombre: string
}) => {

  /* ============================
     Ejecutar cierre
  ============================ */

  const resultado = await cerrarCajaAutomatico({
    cajaId,
    usuarioId,
    rol,
    montoFinal,
    motivoDiferencia,
  })

  /* ============================
     Realtime
  ============================ */

  emitRealtimeEvent({
    type: 'CAJA_CERRADA',
    sucursalId: sucursalId.toString(),
    cajaId: cajaId.toString(),

    origenUsuarioId: usuarioId.toString(),
    origenUsuarioNombre: usuarioNombre,
  })

  return resultado
}