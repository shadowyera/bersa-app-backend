export type RealtimeEventType =
  | 'CAJA_ABIERTA'
  | 'CAJA_CERRADA'

export interface RealtimeEventPayload {
  type: RealtimeEventType
  sucursalId: string
  cajaId: string
  aperturaCajaId?: string
}