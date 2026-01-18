import { Request, Response } from 'express'
import { CategoriaModel } from './categoria.model'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')

/* ================================
   GET /api/categorias
================================ */

export const getCategorias = async (req: Request, res: Response) => {
  const { includeInactive } = req.query

  const filter = includeInactive ? {} : { activo: true }

  const categorias = await CategoriaModel.find(filter).sort({ orden: 1 })

  res.json(categorias)
}

/* ================================
   POST /api/categorias
================================ */

export const createCategoria = async (req: Request, res: Response) => {
  const { nombre, descripcion, color, tipo } = req.body

  if (!nombre) {
    return res.status(400).json({ message: 'Nombre requerido' })
  }

  const slug = slugify(nombre)

  const existe = await CategoriaModel.findOne({ slug })
  if (existe) {
    return res
      .status(409)
      .json({ message: 'Ya existe una categoría con ese nombre' })
  }

  const categoria = await CategoriaModel.create({
    nombre,
    descripcion,
    slug,
    color,
    tipo,
  })

  res.status(201).json(categoria)
}

/* ================================
   PUT /api/categorias/:id
================================ */

export const updateCategoria = async (req: Request, res: Response) => {
  const { id } = req.params
  const { nombre, descripcion, color, tipo, activo, orden } = req.body

  const categoria = await CategoriaModel.findById(id)
  if (!categoria) {
    return res.status(404).json({ message: 'Categoría no encontrada' })
  }

  if (nombre && nombre !== categoria.nombre) {
    const slug = slugify(nombre)

    const existe = await CategoriaModel.findOne({
      slug,
      _id: { $ne: id },
    })

    if (existe) {
      return res
        .status(409)
        .json({ message: 'Ya existe otra categoría con ese nombre' })
    }

    categoria.nombre = nombre
    categoria.slug = slug
  }

  if (descripcion !== undefined) categoria.descripcion = descripcion
  if (color !== undefined) categoria.color = color
  if (tipo !== undefined) categoria.tipo = tipo
  if (orden !== undefined) categoria.orden = orden
  if (activo !== undefined) categoria.activo = activo

  await categoria.save()

  res.json(categoria)
}

/* ================================
   DELETE (DESACTIVAR)
================================ */

export const setCategoriaActiva = async (req: Request, res: Response) => {
  const { id } = req.params
  const { activo } = req.body

  const categoria = await CategoriaModel.findById(id)

  if (!categoria) {
    return res.status(404).json({ message: 'Categoría no encontrada' })
  }

  categoria.activo = Boolean(activo)
  await categoria.save()

  res.json({
    message: activo
      ? 'Categoría reactivada'
      : 'Categoría desactivada',
    categoria,
  })
}