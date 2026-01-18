import { Request, Response } from 'express'
import { RealtimeEventPayload } from './realtime.types'

type Client = {
  res: Response
  heartbeat: NodeJS.Timeout
}

const clientsBySucursal = new Map<string, Set<Client>>()

const HEARTBEAT_INTERVAL = 25_000 // 25s (estándar seguro)

/**
 * Registra un cliente SSE
 */
export function registerSSEClient(
  req: Request,
  res: Response,
  sucursalId: string
) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  res.flushHeaders?.()

  const client: Client = {
    res,
    heartbeat: setInterval(() => {
      res.write(`: heartbeat\n\n`)
    }, HEARTBEAT_INTERVAL),
  }

  if (!clientsBySucursal.has(sucursalId)) {
    clientsBySucursal.set(sucursalId, new Set())
  }

  clientsBySucursal.get(sucursalId)!.add(client)

  req.on('close', () => {
    clearInterval(client.heartbeat)
    clientsBySucursal.get(sucursalId)?.delete(client)

    if (
      clientsBySucursal.get(sucursalId)?.size === 0
    ) {
      clientsBySucursal.delete(sucursalId)
    }
  })
}

/**
 * Emite evento a clientes de una sucursal
 */
export function emitRealtimeEvent(
  payload: RealtimeEventPayload
) {
  const clients = clientsBySucursal.get(
    payload.sucursalId
  )
  if (!clients) return

  const data = `data: ${JSON.stringify(payload)}\n\n`

  for (const client of clients) {
    client.res.write(data)
  }

  console.log(
    `[SSE] ${payload.type} → sucursal ${payload.sucursalId} (${clients.size} clientes)`
  )
}

