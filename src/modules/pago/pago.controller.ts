import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { registrarPagosVenta } from './pago.service';

export const registrarPagosVentaController = async (
  req: Request,
  res: Response
) => {
  try {
    const { ventaId } = req.params;
    const { pagos } = req.body;

    if (!Types.ObjectId.isValid(ventaId)) {
      return res.status(400).json({
        message: 'VentaId inválido',
      });
    }

    if (!Array.isArray(pagos) || pagos.length === 0) {
      return res.status(400).json({
        message: 'Debe enviar pagos',
      });
    }

    const pagosCreados = await registrarPagosVenta(
      new Types.ObjectId(ventaId),
      pagos
    );

    res.status(201).json(pagosCreados);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};
