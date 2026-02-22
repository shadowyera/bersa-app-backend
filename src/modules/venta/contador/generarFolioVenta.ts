import { Types } from 'mongoose'
import { FolioVentaContadorModel } from './folioVentaContador.model'
import SucursalModel from '../../sucursal/sucursal.model';


function pad(num: number, size: number) {
  return num.toString().padStart(size, '0')
}

/**
 * Retorna folio único por sucursal
 * Ej: LON-20260222-000123
 */
export async function generarFolioVenta(
  sucursalId: Types.ObjectId
): Promise<string> {

  const contador =
    await FolioVentaContadorModel.findOneAndUpdate(
      { sucursalId },
      { $inc: { ultimoNumero: 1 } },
      { new: true, upsert: true }
    )

  const sucursal =
    await SucursalModel.findById(sucursalId)
      .select('codigo')
      .lean()

  if (!sucursal?.codigo) {
    throw new Error(
      'Sucursal sin código configurado'
    )
  }

  const hoy = new Date()
  const yyyy = hoy.getFullYear()
  const mm = pad(hoy.getMonth() + 1, 2)
  const dd = pad(hoy.getDate(), 2)

  return `${sucursal.codigo}-${yyyy}${mm}${dd}-${pad(
    contador!.ultimoNumero,
    6
  )}`
}