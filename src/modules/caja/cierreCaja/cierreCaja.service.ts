import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../aperturaCaja/aperturaCaja.model'
import { calcularResumenCaja } from './cierreCaja.calculo'

export const cerrarCajaAutomatico = async ({
  cajaId,
  usuarioId,
  rol,
  montoFinal,
  motivoDiferencia,
}: {
  cajaId: Types.ObjectId
  usuarioId: Types.ObjectId
  rol: 'ADMIN' | 'ENCARGADO' | 'CAJERO' | 'BODEGUERO'
  montoFinal: number
  motivoDiferencia?: string
}) => {

  /* ============================
     Validaciones base
  ============================ */

  if (montoFinal < 0) {
    throw new Error('Monto final inválido')
  }

  if (rol === 'BODEGUERO') {
    throw new Error('No tienes permiso para cerrar caja')
  }

  /* ============================
     Calcular resumen
  ============================ */

  const resumen = await calcularResumenCaja(cajaId)

  const diferencia =
    montoFinal - resumen.efectivoEsperado

  /* ============================
     Regla negocio NUEVA
  ============================ */

  if (diferencia !== 0 && !motivoDiferencia) {
    throw new Error(
      'Debe indicar motivo de diferencia'
    )
  }

  /* ============================
     Persistencia
  ============================ */

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
  apertura.usuarioCierreId = usuarioId

  // 🔥 NUEVO
  apertura.motivoDiferencia =
    diferencia !== 0
      ? motivoDiferencia
      : undefined

  await apertura.save()

  /* ============================
     Response
  ============================ */

  return {
    ...resumen,
    montoFinal,
    diferencia,
    motivoDiferencia:
      apertura.motivoDiferencia ?? null,
    fechaCierre: apertura.fechaCierre,
    usuarioCierreId: usuarioId,
  }
}