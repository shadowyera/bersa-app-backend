import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { crearVentaPOS } from './venta.service'

/**
 * ================================
 * CREAR VENTA POS
 * ================================
 */
export const createVentaPOS = async (req: Request, res: Response) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    const { cajaId, aperturaCajaId, items, pagos, ajusteRedondeo } = req.body

    if (!cajaId || !aperturaCajaId || !items || !pagos) {
      return res.status(400).json({ message: 'Datos incompletos' })
    }

    const venta = await crearVentaPOS({
      cajaId: new Types.ObjectId(cajaId),
      aperturaCajaId: new Types.ObjectId(aperturaCajaId),
      usuarioId: new Types.ObjectId(user._id),
      items: items.map((i: any) => ({
        productoId: new Types.ObjectId(i.productoId),
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
      pagos,
      ajusteRedondeo: Number(ajusteRedondeo || 0),
    })

    return res.status(201).json(venta)
  } catch (e: any) {
    return res.status(400).json({ message: e.message })
  }
}