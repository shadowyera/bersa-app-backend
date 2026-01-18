// src/modules/stock/stock.controller.ts
import { Request, Response } from 'express';
import { StockSucursalModel } from './stock.model';
import { Types } from 'mongoose';

export const getStockBySucursal = async (req: Request, res: Response) => {
  const { sucursalId } = req.params;

   const stock = await StockSucursalModel.find({ sucursalId })
    .populate({
      path: 'productoId',
      select: 'nombre codigo precio activo categoriaId proveedorId',
      populate: [
        {
          path: 'categoriaId',
          select: 'nombre',
        },
        {
          path: 'proveedorId',
          select: 'nombre',
        },
      ],
    });

  res.json(stock);
};

export const getStockByProducto = async (req: Request, res: Response) => {
  const { productoId } = req.params;

  const stock = await StockSucursalModel.find({ productoId })
    .populate('sucursalId');

  res.json(stock);
};

/**
 * PUT /api/stock/:stockId/habilitado
 * Habilita o deshabilita un producto en una sucursal
 */
export const updateStockHabilitado = async (
  req: Request,
  res: Response
) => {
  try {
    const { stockId } = req.params;
    const { habilitado } = req.body;

    // ================================
    // Validaciones
    // ================================

    if (!Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({
        message: 'stockId inválido',
      });
    }

    if (typeof habilitado !== 'boolean') {
      return res.status(400).json({
        message: 'El campo habilitado debe ser boolean',
      });
    }

    // ================================
    // Buscar stock
    // ================================

    const stock = await StockSucursalModel.findById(stockId);

    if (!stock) {
      return res.status(404).json({
        message: 'Stock no encontrado',
      });
    }

    // ================================
    // Actualizar habilitado
    // ================================

    stock.habilitado = habilitado;
    await stock.save();

    return res.json({
      message: `Producto ${
        habilitado ? 'habilitado' : 'deshabilitado'
      } en la sucursal`,
      data: stock,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al actualizar estado del producto',
    });
  }
};