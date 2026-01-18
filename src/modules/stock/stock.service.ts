import { Types } from 'mongoose';
import { StockSucursalModel } from './stock.model';
import SucursalModel from '../sucursal/sucursal.model';
import ProductoModel from '../producto/producto.model';

/**
 * Inicializa stock en 0 para un producto en todas las sucursales activas
 */
export const inicializarStockPorProducto = async (
  productoId: Types.ObjectId
) => {
  const sucursales = await SucursalModel.find({ activo: true });

  const documentos = sucursales.map((sucursal) => ({
    productoId,
    sucursalId: sucursal._id,
    cantidad: 0,
  }));

  if (documentos.length === 0) return;

  await StockSucursalModel.insertMany(documentos, {
    ordered: false, // ignora duplicados si existen
  });
};

/**
 * Inicializa stock en 0 para una sucursal con todos los productos activos
 */
export const inicializarStockPorSucursal = async (
  sucursalId: Types.ObjectId
) => {
  const productos = await ProductoModel.find({ activo: true });

  const documentos = productos.map((producto) => ({
    productoId: producto._id,
    sucursalId,
    cantidad: 0,
  }));

  if (documentos.length === 0) return;

  await StockSucursalModel.insertMany(documentos, {
    ordered: false,
  });
};
