import { Request, Response } from 'express';
import { ProveedorModel } from './proveedor.model';

/**
 * GET /api/proveedores
 * Opcional: ?activo=true|false
 */
export const getProveedores = async (req: Request, res: Response) => {
  try {
    const filtro: any = {};

    if (req.query.activo !== undefined) {
      filtro.activo = req.query.activo === 'true';
    }

    const proveedores = await ProveedorModel.find(filtro)
      .sort({ nombre: 1 });

    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
};

/**
 * POST /api/proveedores
 */
export const createProveedor = async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    const nombreLimpio = nombre.trim();

    const existe = await ProveedorModel.findOne({
      nombre: nombreLimpio,
    });

    if (existe) {
      return res
        .status(409)
        .json({ message: 'Proveedor ya existe' });
    }

    const proveedor = await ProveedorModel.create({
      nombre: nombreLimpio,
      activo: true,
    });

    res.status(201).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};

/**
 * PUT /api/proveedores/:id
 */
export const updateProveedor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ message: 'Nombre requerido' });
    }

    const proveedor = await ProveedorModel.findById(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    proveedor.nombre = nombre.trim();
    await proveedor.save();

    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar proveedor' });
  }
};

/**
 * PATCH /api/proveedores/:id/activar
 * body: { activo: boolean }
 */
export const toggleProveedorActivo = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res
        .status(400)
        .json({ message: 'Campo activo inválido' });
    }

    const proveedor = await ProveedorModel.findById(id);

    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    proveedor.activo = activo;
    await proveedor.save();

    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};