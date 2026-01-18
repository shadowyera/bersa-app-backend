import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from './aperturaCaja.model'
import { calcularResumenCaja } from './cierreCaja.calculo'

export const cerrarCajaAutomatico = async ({
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
  if (montoFinal < 0) {
    throw new Error('Monto final inválido')
  }

  if (rol === 'BODEGUERO') {
    throw new Error('No tienes permiso para cerrar caja')
  }

  const resumen = await calcularResumenCaja(cajaId)

  const diferencia =
    montoFinal - resumen.efectivoEsperado

  const apertura = await AperturaCajaModel.findById(
    resumen.aperturaId
  )

  if (!apertura) {
    throw new Error('Apertura no encontrada')
  }

  apertura.estado = ESTADO_APERTURA_CAJA.CERRADA
  apertura.fechaCierre = new Date()
  apertura.montoFinal = montoFinal
  apertura.diferencia = diferencia
  apertura.usuarioCierreId = usuarioId   // 🔥

  await apertura.save()

  return {
    ...resumen,
    montoFinal,
    diferencia,
    fechaCierre: apertura.fechaCierre,
    usuarioCierreId: usuarioId,
  }
}