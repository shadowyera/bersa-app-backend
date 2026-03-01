import { Types, ClientSession } from 'mongoose'
import { VentaContadorModel } from './ventaContador.model'

export async function generarNumeroVenta(
  aperturaCajaId: Types.ObjectId,
  session?: ClientSession
): Promise<number> {

  const contador =
    await VentaContadorModel.findOneAndUpdate(
      { aperturaCajaId },
      { $inc: { ultimoNumero: 1 } },
      {
        new: true,
        upsert: true,
        session
      }
    )

  return contador!.ultimoNumero
}