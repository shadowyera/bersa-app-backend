import { Types } from 'mongoose'
import { abrirCaja } from './aperturaCaja.service'
import { emitRealtimeEvent } from '../realtime/realtime.service'

/**
 * Application Service
 * - Orquesta dominio + efectos externos
 * - Mantiene aperturaCaja.service como dominio puro
 */
export const abrirCajaApp = async ({
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
  // 1️⃣ Dominio puro
  const apertura = await abrirCaja({
    cajaId,
    sucursalId,
    usuarioId,
    montoInicial,
  })

  // 2️⃣ Side-effect: evento en tiempo real
  emitRealtimeEvent({
    type: 'CAJA_ABIERTA',
    sucursalId: sucursalId.toString(),
    cajaId: cajaId.toString(),
    aperturaCajaId: apertura._id.toString(),
  })

  // 3️⃣ Retorno limpio
  return apertura
}