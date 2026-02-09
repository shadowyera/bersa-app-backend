import { Request, Response } from 'express'
import { getPedidoPreparacion } from './pedido-interno-preparacion.service'

export async function obtenerPreparacionPedido(
  req: Request,
  res: Response
) {
  try {
    const data = await getPedidoPreparacion(
      req.params.id,
      req.user!.sucursalId
    )

    return res.json(data)
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ??
        'Error al obtener preparación del pedido',
    })
  }
}