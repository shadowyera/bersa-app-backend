import { Types } from 'mongoose'
import { VentaModel } from '../venta/venta.model'
import { AperturaCajaModel, ESTADO_APERTURA_CAJA } from './aperturaCaja.model'

export const calcularCorteCajeros = async (cajaId: Types.ObjectId) => {
  const apertura = await AperturaCajaModel.findOne({
    cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  })

  if (!apertura) {
    throw new Error('No hay caja abierta')
  }

  const ventas = await VentaModel.aggregate([
    {
      $match: {
        aperturaCajaId: apertura._id,
        estado: 'FINALIZADA',
      },
    },
    {
      $group: {
        _id: '$usuarioId',
        total: { $sum: '$totalCobrado' },
        ventas: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: '_id',
        foreignField: '_id',
        as: 'usuario',
      },
    },
    { $unwind: '$usuario' },
  ])

  return {
    cajaId,
    aperturaId: apertura._id,
    fechaApertura: apertura.fechaApertura,
    cajeros: ventas.map(v => ({
      usuarioId: v._id,
      nombre: v.usuario.nombre,
      total: v.total,
      ventas: v.ventas,
    })),
  }
}