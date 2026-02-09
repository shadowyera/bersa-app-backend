import { Request, Response } from 'express'
import { RealtimeEventPayload } from './realtime.types'

type Client = {
  res: Response
  heartbeat: NodeJS.Timeout
}

const clientsBySucursal = new Map<string, Set<Client>>()

const HEARTBEAT_INTERVAL = 25_000
const RETRY_INTERVAL = 5_000

/**
 * Registra un cliente SSE por sucursal
 * - Mantiene conexión viva
 * - Limpia correctamente al desconectar
 */
export function registerSSEClient(
  req: Request,
  res: Response,
  sucursalId: string // 🔥 YA STRING
) {
  // Headers obligatorios SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  res.flushHeaders?.()

  // Indica al cliente cada cuánto reintentar conexión
  res.write(`retry: ${RETRY_INTERVAL}\n\n`)

  const client: Client = {
    res,
    heartbeat: setInterval(() => {
      // Comentario SSE válido (mantiene viva la conexión)
      res.write(': heartbeat\n\n')
    }, HEARTBEAT_INTERVAL),
  }

  // 🔥 FIX CLAVE: sucursalId ya normalizado a string
  if (!clientsBySucursal.has(sucursalId)) {
    clientsBySucursal.set(sucursalId, new Set())
  }

  clientsBySucursal.get(sucursalId)!.add(client)

  console.log('[SSE] cliente registrado', {
    sucursalId,
    totalClientes:
      clientsBySucursal.get(sucursalId)!.size,
  })

  // Limpieza al cerrar conexión
  req.on('close', () => {
    clearInterval(client.heartbeat)

    const clients =
      clientsBySucursal.get(sucursalId)
    if (!clients) return

    clients.delete(client)

    if (clients.size === 0) {
      clientsBySucursal.delete(sucursalId)
    }

    console.log('[SSE] cliente desconectado', {
      sucursalId,
      restantes: clients.size,
    })
  })
}

/**
 * Emite evento SSE a clientes conectados
 */
export function emitRealtimeEvent(
  payload: RealtimeEventPayload
) {
  const message =
    `event: ${payload.type}\n` +
    `data: ${JSON.stringify(payload)}\n\n`

  // 🌍 Eventos globales
  if (payload.sucursalId === 'GLOBAL') {
    for (const clients of clientsBySucursal.values()) {
      for (const client of clients) {
        client.res.write(message)
      }
    }

    console.log(`[SSE] ${payload.type} → GLOBAL`)
    return
  }

  // 🎯 Eventos por sucursal (STRING vs STRING)
  const clients =
    clientsBySucursal.get(payload.sucursalId)

  if (!clients) {
    console.warn(
      '[SSE] sin clientes para sucursal',
      payload.sucursalId,
      'keys:',
      [...clientsBySucursal.keys()]
    )
    return
  }

  for (const client of clients) {
    client.res.write(message)
  }
  console.log(
    `[SSE] ${payload.type} → sucursal ${payload.sucursalId} (${clients.size})`
  )
}