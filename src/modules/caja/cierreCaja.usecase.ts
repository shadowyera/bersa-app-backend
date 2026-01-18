import { Types } from 'mongoose'
import {
  cerrarCajaAutomatico,
} from './cierreCaja.service'
import { AperturaCajaModel } from './aperturaCaja.model'
import { emitRealtimeEvent } from '../realtime/realtime.service'

/**
 * Application Service
 * - Orquesta cierre de caja + realtime
 * - Dominio permanece intacto
 */
export const cerrarCajaAutomaticoApp = async ({
  cajaId,
  usuarioId,
  rol,
  montoFinal,
}: {
  cajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  rol: 'ADMIN' | 'ENCARGADO' | 'CAJERO' | 'BODEGUERO'
  montoFinal: number
}) => {
  // 1️⃣ Ejecutar dominio
  const resultado = await cerrarCajaAutomatico({
    cajaId,
    usuarioId,
    rol,
    montoFinal,
  })

  // 2️⃣ Buscar la apertura recién cerrada
  const apertura = await AperturaCajaModel.findOne({
    cajaId,
    estado: 'CERRADA',
  })
    .sort({ fechaCierre: -1 })
    .lean()

  if (apertura) {
    // 3️⃣ Side-effect: notificar a todos los POS
    emitRealtimeEvent({
      type: 'CAJA_CERRADA',
      sucursalId: apertura.sucursalId.toString(),
      cajaId: apertura.cajaId.toString(),
      aperturaCajaId: apertura._id.toString(),
    })
  }

  // 4️⃣ Retorno limpio
  return resultado
}