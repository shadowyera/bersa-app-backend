import { Request, Response } from 'express'
import { getCatalogoParaPedido } from './catalogo-pedido.service'

/* =====================================================
   Controller: Catálogo para crear pedido
   -----------------------------------------------------
   - Vista especializada para CrearPedido
   - SOLO lectura
   - Usa stock por sucursal (fuente real)
===================================================== */

export async function listarCatalogoParaPedido(
  req: Request,
  res: Response
) {
  try {
    const sucursalId = req.user?.sucursalId

    if (!sucursalId) {
      return res.status(401).json({
        message: 'Sucursal no encontrada en sesión',
      })
    }

    const catalogo = await getCatalogoParaPedido(
      sucursalId
    )

    return res.json(catalogo)
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al obtener catálogo para pedido',
    })
  }
}