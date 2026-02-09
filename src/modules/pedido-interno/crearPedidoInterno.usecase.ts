import { crearPedidoInterno } from './pedido-interno.service'
import { emitRealtimeEvent } from '../realtime/realtime.service'

/**
 * Application Service
 * -------------------
 * - Orquesta creación de pedido interno
 * - Emite evento realtime PEDIDO_CREATED
 * - Notifica a solicitante y abastecedora
 */
export async function crearPedidoInternoUsecase({
  sucursalSolicitanteId,
  sucursalAbastecedoraId,
  items,
  usuarioId,
}: {
  sucursalSolicitanteId: string
  sucursalAbastecedoraId: string
  items: {
    productoId: string
    cantidadSolicitada: number
  }[]
  usuarioId: string
}) {
  // 1️⃣ Dominio puro
  const pedido = await crearPedidoInterno({
    sucursalSolicitanteId,
    sucursalAbastecedoraId,
    items,
  })

  const pedidoId = pedido._id.toString()

  // 2️⃣ Realtime → sucursal ABASTECEDORA (Admin/Bodega)
  emitRealtimeEvent({
    type: 'PEDIDO_CREATED',
    sucursalId: sucursalAbastecedoraId,
    pedidoId,
    origenUsuarioId: usuarioId,
  })

  // 3️⃣ Realtime → sucursal SOLICITANTE (Mis pedidos)
  emitRealtimeEvent({
    type: 'PEDIDO_CREATED',
    sucursalId: sucursalSolicitanteId,
    pedidoId,
    origenUsuarioId: usuarioId,
  })

  return pedido
}