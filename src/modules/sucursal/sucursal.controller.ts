import { Request, Response } from 'express';
import SucursalModel from './sucursal.model';
import { inicializarStockPorSucursal } from '../stock/stock.service';

export const getSucursales = async (req: Request, res: Response): Promise<Response> => {
  try {
    const sucursales = await SucursalModel.find();
    return res.status(200).json(sucursales);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error al obtener las sucursales', error: error.message });
    }
    return res.status(500).json({ message: 'Error desconocido al obtener las sucursales' });
  }
};

export const createSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { nombre, direccion, telefono } = req.body;
    const nuevaSucursal = new SucursalModel({ nombre, direccion, telefono });
    
    await nuevaSucursal.save();

    await inicializarStockPorSucursal(nuevaSucursal._id);
    return res.status(201).json(nuevaSucursal);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error al crear la sucursal', error: error.message });
    }
    return res.status(500).json({ message: 'Error desconocido al crear la sucursal' });
  }
};

export const updateSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, activo } = req.body;
    const sucursalActualizada = await SucursalModel.findByIdAndUpdate(id, { nombre, direccion, telefono, activo }, { new: true });
    if (!sucursalActualizada) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    return res.status(200).json(sucursalActualizada);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error al actualizar la sucursal', error: error.message });
    }
    return res.status(500).json({ message: 'Error desconocido al actualizar la sucursal' });
  }
};

export const deleteSucursal = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const sucursalEliminada = await SucursalModel.findByIdAndDelete(id);
    if (!sucursalEliminada) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    return res.status(200).json({ message: 'Sucursal eliminada correctamente' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ message: 'Error al eliminar la sucursal', error: error.message });
    }
    return res.status(500).json({ message: 'Error desconocido al eliminar la sucursal' });
  }
};
