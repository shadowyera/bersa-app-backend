import { Types } from 'mongoose'
import { abrirCaja } from './aperturaCaja.service'
import { emitRealtimeEvent } from '../../realtime/realtime.service'

/**
 * Application Service
 * - Orquesta dominio + efectos externos
 * - Dominio sigue siendo puro
 * - Contexto humano se inyecta desde el controller
 */


export const abrirCajaApp = async ({
  cajaId,
  sucursalId,
  usuarioId,
  usuarioNombre,
  montoInicial,
}: {
  cajaId: Types.ObjectId
  sucursalId: Types.ObjectId
  usuarioId: Types.ObjectId
  usuarioNombre: string
  montoInicial: number
}) => {
  // 1️⃣ Dominio puro
  const apertura = await abrirCaja({
    cajaId,
    sucursalId,
    usuarioId,
    montoInicial,
  })

  // 2️⃣ Side-effect: evento realtime enriquecido
  emitRealtimeEvent({
    type: 'CAJA_ABIERTA',
    sucursalId: sucursalId.toString(),
    cajaId: cajaId.toString(),
    aperturaCajaId: apertura._id.toString(),

    // 👇 CLAVE PARA MULTI-USUARIO
    origenUsuarioId: usuarioId.toString(),
    origenUsuarioNombre: usuarioNombre,
  })

  

  // 3️⃣ Retorno limpio
  return apertura
}