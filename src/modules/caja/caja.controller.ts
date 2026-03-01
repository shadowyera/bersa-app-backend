import { Request, Response } from 'express'
import { CajaModel } from './caja.model'
import { AperturaCajaModel, ESTADO_APERTURA_CAJA } from './aperturaCaja/aperturaCaja.model'

/* ================================
   Crear caja
================================ */
export const createCaja = async (req: Request, res: Response) => {
  try {
    const { nombre, sucursalId } = req.body

    if (!nombre || !sucursalId) {
      return res.status(400).json({
        message: 'Nombre y sucursalId son obligatorios',
      })
    }

    const caja = await CajaModel.create({
      nombre,
      sucursalId,
    })

    res.status(201).json(caja)
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear caja',
    })
  }
}

/* ================================
   Listar cajas (por sucursal)
================================ */
export const getCajas = async (req: Request, res: Response) => {
  try {
    const user = req.user

    if (!user?.sucursal?.id) {
      return res.status(400).json({
        message: 'Sucursal no encontrada en sesión',
      })
    }

    const sucursalId = user.sucursal.id

    const cajas = await CajaModel.find({ sucursalId })

    const aperturas = await AperturaCajaModel.find({
      sucursalId,
      estado: ESTADO_APERTURA_CAJA.ABIERTA,
    }).populate('usuarioAperturaId', 'nombre')

    const mapaAperturas = new Map(
      aperturas.map(a => [a.cajaId.toString(), a])
    )

    const result = cajas.map(caja => {
      const apertura = mapaAperturas.get(caja._id.toString())

      return {
        id: caja._id.toString(),
        nombre: caja.nombre,
        activa: caja.activa,
        abierta: !!apertura,
        usuarioAperturaNombre: apertura
          ? (apertura.usuarioAperturaId as any)?.nombre
          : undefined,
        fechaApertura: apertura
          ? apertura.fechaApertura
          : undefined,
      }
    })
console.log('Cajas obtenidas:', result)
    return res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener cajas' })
  }
}

/* ================================
   Activar / desactivar caja
================================ */
export const toggleCaja = async (req: Request, res: Response) => {
  try {
    const { cajaId } = req.params

    const caja = await CajaModel.findById(cajaId)
    if (!caja) {
      return res.status(404).json({
        message: 'Caja no encontrada',
      })
    }

    caja.activa = !caja.activa
    await caja.save()

    res.json(caja)
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar caja',
    })
  }
}