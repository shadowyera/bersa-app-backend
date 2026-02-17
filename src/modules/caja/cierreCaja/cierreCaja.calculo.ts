import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../aperturaCaja/aperturaCaja.model'
import { PagoModel } from '../../pago/pago.model'
import { VentaModel } from '../../venta/venta.model'

type PagosPorTipo = {
  EFECTIVO: number
  DEBITO: number
  CREDITO: number
  TRANSFERENCIA: number
}

export const calcularResumenCaja = async (
  cajaId: Types.ObjectId
) => {

  const apertura = await AperturaCajaModel.findOne({
    cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })

  if (!apertura) {
    throw new Error('No hay caja abierta')
  }

  /* ================================
     Ventas FINALIZADAS
  ================================ */

  const ventasFinalizadas = await VentaModel.find({
    aperturaCajaId: apertura._id,
    estado: 'FINALIZADA',
  })

  /* ================================
     Pagos de esas ventas
  ================================ */

  const pagos = await PagoModel.find({
    ventaId: {
      $in: ventasFinalizadas.map(v => v._id),
    },
  })

  /* ================================
     Totales
  ================================ */

  const totalVentas = ventasFinalizadas.reduce(
    (sum, v) => sum + v.total,
    0
  )

  const pagosPorTipo: PagosPorTipo = {
    EFECTIVO: 0,
    DEBITO: 0,
    CREDITO: 0,
    TRANSFERENCIA: 0,
  }

  for (const p of pagos) {
    if (pagosPorTipo[p.tipo] !== undefined) {
      pagosPorTipo[p.tipo] += p.monto
    }
  }

  const efectivoVentas = pagosPorTipo.EFECTIVO

  const efectivoEsperado =
    apertura.montoInicial + efectivoVentas

  return {
    cajaId,
    aperturaId: apertura._id,
    montoInicial: apertura.montoInicial,

    totalVentas,

    efectivoVentas,
    efectivoEsperado,

    pagosPorTipo,
  }
}