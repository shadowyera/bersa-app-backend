import { prepararPedidoInterno } from '../pedido-interno.service'
import { emitRealtimeEvent } from '../../realtime/realtime.service'

/**
 * Application Service
 * -------------------
 * - Orquesta dominio + efectos secundarios
 * - NO depende de Express ni Mongoose
 * - Emite realtime SOLO si el dominio fue exitoso
 */
export async function prepararPedidoInternoUsecase({
  pedidoId,
  itemsPreparados,
  sucursalAbastecedoraId,
  usuarioId,
}: {
  pedidoId: string
  itemsPreparados: {
    productoId: string
    cantidadPreparada: number
  }[]
  sucursalAbastecedoraId: string
  usuarioId: string
}) {
  // 1️⃣ Dominio puro
  const pedido = await prepararPedidoInterno(
    pedidoId,
    itemsPreparados,
    sucursalAbastecedoraId
  )

  // 2️⃣ Side-effect: evento realtime
  emitRealtimeEvent({
    type: 'PEDIDO_PREPARADO',
    sucursalId: sucursalAbastecedoraId,
    pedidoId,
    origenUsuarioId: usuarioId,
  })

  // 3️⃣ Retorno limpio
  return pedido
}