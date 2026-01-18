import { Types } from 'mongoose'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from './aperturaCaja.model'
import { PagoModel } from '../pago/pago.model'
import { VentaModel } from '../venta/venta.model'

export const calcularResumenCaja = async (cajaId: Types.ObjectId) => {
  const apertura = await AperturaCajaModel.findOne({
    cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })

  if (!apertura) {
    throw new Error('No hay caja abierta')
  }

  const ventas = await VentaModel.find({
    aperturaCajaId: apertura._id,
    estado: 'FINALIZADA',
  })

  const pagos = await PagoModel.find({
    aperturaCajaId: apertura._id,
  })

  const totalVentas = ventas.reduce(
    (sum, v) => sum + v.total,
    0
  )

  const efectivoVentas = pagos
    .filter(p => p.tipo === 'EFECTIVO')
    .reduce((sum, p) => sum + p.monto, 0)

  const efectivoEsperado =
    apertura.montoInicial + efectivoVentas

  return {
    cajaId,
    aperturaId: apertura._id,
    montoInicial: apertura.montoInicial,
    totalVentas,
    efectivoVentas,
    efectivoEsperado,
  }
}