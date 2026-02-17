import { Types } from 'mongoose'
import { VentaModel } from '../../venta/venta.model'
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../aperturaCaja/aperturaCaja.model'

/**
 * Obtiene todas las ventas de la apertura activa
 * ordenadas por numeroVenta
 */
export const obtenerVentasAperturaActiva = async (
  cajaId: Types.ObjectId
) => {

  const apertura = await AperturaCajaModel.findOne({
    cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })

  if (!apertura) {
    throw new Error('No hay caja abierta')
  }

  const ventas = await VentaModel.find({
    aperturaCajaId: apertura._id,
  })
    .select(
      '_id numeroVenta createdAt totalCobrado estado documentoTributario.tipo'
    )
    .sort({ numeroVenta: -1 }) // 👈 Últimas primero
    .lean()

  return {
    cajaId,
    aperturaId: apertura._id,
    fechaApertura: apertura.fechaApertura,
    ventas: ventas.map(v => ({
      ventaId: v._id,
      numeroVenta: v.numeroVenta,
      fecha: v.createdAt,
      total: v.totalCobrado,
      estado: v.estado,
      documentoTributario: {
        tipo: v.documentoTributario?.tipo ?? 'BOLETA',
      },
    })),
  }
}