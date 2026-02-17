import { Types } from 'mongoose'
import { VentaContadorModel } from './ventaContador.model'

/**
 * Retorna el siguiente número correlativo de venta
 * por apertura de caja.
 */
export async function generarNumeroVenta(
  aperturaCajaId: Types.ObjectId
): Promise<number> {

  const contador = await VentaContadorModel.findOneAndUpdate(
    { aperturaCajaId },
    { $inc: { ultimoNumero: 1 } },
    {
      new: true,
      upsert: true
    }
  )

  return contador!.ultimoNumero
}