import { Types } from 'mongoose'
import { ProveedorModel } from './proveedor.model'

/* =====================================================
   INPUTS
===================================================== */

interface ListarProveedoresInput {
  search?: string
  activo?: boolean
}

interface CrearProveedorInput {
  nombre: string
}

interface ActualizarProveedorInput {
  proveedorId: Types.ObjectId
  nombre: string
}

interface ToggleProveedorInput {
  proveedorId: Types.ObjectId
  activo: boolean
}

/* =====================================================
   LISTAR PROVEEDORES (ADMIN)
===================================================== */

export const listarProveedores = async (
  filtros: ListarProveedoresInput
) => {

  const query: any = {}

  if (typeof filtros.activo === 'boolean') {
    query.activo = filtros.activo
  }

  if (filtros.search?.trim()) {
    query.nombre = {
      $regex: filtros.search.trim(),
      $options: 'i', // case-insensitive
    }
  }

  const proveedores = await ProveedorModel.find(query)
    .sort({ nombre: 1 })
    .lean()

  return proveedores.map(p => ({
    _id: p._id,
    nombre: p.nombre,
    activo: p.activo,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))
}

/* =====================================================
   CREAR PROVEEDOR
===================================================== */

export const crearProveedor = async (
  input: CrearProveedorInput
) => {

  const nombreLimpio = input.nombre?.trim()

  if (!nombreLimpio) {
    throw new Error('Nombre requerido')
  }

  const nombreNormalizado = nombreLimpio.toLowerCase()

  const existe = await ProveedorModel.findOne({
    nombre: { $regex: `^${nombreNormalizado}$`, $options: 'i' },
  })

  if (existe) {
    throw new Error('Proveedor ya existe')
  }

  const proveedor = await ProveedorModel.create({
    nombre: nombreLimpio,
    activo: true,
  })

  return proveedor
}

/* =====================================================
   ACTUALIZAR PROVEEDOR
===================================================== */

export const actualizarProveedor = async (
  input: ActualizarProveedorInput
) => {

  const { proveedorId, nombre } = input

  const nombreLimpio = nombre?.trim()

  if (!nombreLimpio) {
    throw new Error('Nombre requerido')
  }

  const proveedor = await ProveedorModel.findById(proveedorId)

  if (!proveedor) {
    throw new Error('Proveedor no encontrado')
  }

  const nombreNormalizado = nombreLimpio.toLowerCase()

  const duplicado = await ProveedorModel.findOne({
    _id: { $ne: proveedorId },
    nombre: { $regex: `^${nombreNormalizado}$`, $options: 'i' },
  })

  if (duplicado) {
    throw new Error('Ya existe un proveedor con ese nombre')
  }

  proveedor.nombre = nombreLimpio
  await proveedor.save()

  return proveedor
}

/* =====================================================
   TOGGLE ACTIVO
===================================================== */

export const toggleProveedorActivo = async (
  input: ToggleProveedorInput
) => {

  const { proveedorId, activo } = input

  const proveedor = await ProveedorModel.findById(proveedorId)

  if (!proveedor) {
    throw new Error('Proveedor no encontrado')
  }

  proveedor.activo = activo
  await proveedor.save()

  return proveedor
}