import { Request, Response } from 'express'
import { Types } from 'mongoose'

/* =====================================================
   Services
===================================================== */
import { crearDespachoInterno } from './despacho-interno.service'

/* =====================================================
   Model (solo lectura)
===================================================== */
import { DespachoInternoModel } from './despacho-interno.model'

/* =====================================================
   Types
===================================================== */
import {
  ORIGEN_DESPACHO_INTERNO,
} from './despacho-interno.types'

/* =====================================================
   CREAR DESPACHO INTERNO
   - Desde PEDIDO (con o sin suplentes)
   - DIRECTO
===================================================== */
export async function crearDespachoInternoController(
  req: Request,
  res: Response
) {
  try {
    const {
      origen,
      pedidoIds,
      itemsSuplentes,
      sucursalDestinoId,
      items,
    } = req.body

    /* ===============================
       Validación común
    =============================== */

    if (
      !Object.values(ORIGEN_DESPACHO_INTERNO).includes(origen)
    ) {
      return res.status(400).json({
        message: 'Origen de despacho inválido',
      })
    }

    /* =================================================
       DESPACHO DESDE PEDIDO
    ================================================= */
    if (origen === ORIGEN_DESPACHO_INTERNO.PEDIDO) {
      if (
        !Array.isArray(pedidoIds) ||
        pedidoIds.length === 0
      ) {
        return res.status(400).json({
          message:
            'Debe enviar al menos un pedidoId',
        })
      }

      for (const id of pedidoIds) {
        if (!Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            message: `pedidoId inválido: ${id}`,
          })
        }
      }

      if (itemsSuplentes) {
        if (!Array.isArray(itemsSuplentes)) {
          return res.status(400).json({
            message:
              'itemsSuplentes debe ser un arreglo',
          })
        }

        for (const item of itemsSuplentes) {
          if (
            !Types.ObjectId.isValid(item.productoId) ||
            typeof item.cantidad !== 'number' ||
            item.cantidad <= 0
          ) {
            return res.status(400).json({
              message:
                'Item suplente inválido',
            })
          }
        }
      }

      const despacho = await crearDespachoInterno({
        origen: ORIGEN_DESPACHO_INTERNO.PEDIDO,
        pedidoIds,
        itemsSuplentes,
        sucursalOrigenId: req.user!.sucursalId,
        usuarioId: req.user!._id,
      })

      return res.status(201).json({
        ok: true,
        data: despacho,
      })
    }

    /* =================================================
       DESPACHO DIRECTO
    ================================================= */
    if (origen === ORIGEN_DESPACHO_INTERNO.DIRECTO) {
      if (
        !Types.ObjectId.isValid(sucursalDestinoId)
      ) {
        return res.status(400).json({
          message:
            'sucursalDestinoId inválido',
        })
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message:
            'Despacho directo debe tener items',
        })
      }

      for (const item of items) {
        if (
          !Types.ObjectId.isValid(item.productoId) ||
          typeof item.cantidad !== 'number' ||
          item.cantidad <= 0
        ) {
          return res.status(400).json({
            message:
              'Item de despacho directo inválido',
          })
        }
      }

      const despacho = await crearDespachoInterno({
        origen: ORIGEN_DESPACHO_INTERNO.DIRECTO,
        sucursalOrigenId: req.user!.sucursalId,
        sucursalDestinoId,
        usuarioId: req.user!._id,
        items,
      })

      return res.status(201).json({
        ok: true,
        data: despacho,
      })
    }

    return res.status(400).json({
      message: 'Payload de despacho inválido',
    })
  } catch (error: any) {
    return res.status(400).json({
      message:
        error?.message ??
        'Error al crear despacho interno',
    })
  }
}

/* =====================================================
   LISTAR DESPACHOS INTERNOS
===================================================== */
export async function listarDespachosInternosController(
  req: Request,
  res: Response
) {
  try {
    const filter: any = {
      sucursalOrigenId: req.user!.sucursalId,
    }

    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 10)
    const skip = (page - 1) * limit

    const [despachos, total] = await Promise.all([
      DespachoInternoModel.find(filter)
        .sort({ creadoEn: -1 })
        .skip(skip)
        .limit(limit),

      DespachoInternoModel.countDocuments(filter),
    ])

    return res.status(200).json({
      data: despachos,
      total,
      page,
      limit,
    })
  } catch (error) {
    return res.status(500).json({
      message:
        'Error al listar despachos internos',
    })
  }
}

/* =====================================================
   OBTENER DESPACHO INTERNO POR ID
===================================================== */
export async function getDespachoInternoByIdController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'ID de despacho inválido',
      })
    }

    const despacho = await DespachoInternoModel.findById(
      id
    )

    if (!despacho) {
      return res.status(404).json({
        message: 'Despacho no encontrado',
      })
    }

    if (
      despacho.sucursalOrigenId.toString() !==
      req.user!.sucursalId
    ) {
      return res.status(403).json({
        message: 'No autorizado',
      })
    }

    return res.status(200).json({
      data: despacho,
    })
  } catch (error: any) {
    return res.status(500).json({
      message:
        error?.message ??
        'Error al obtener despacho interno',
    })
  }
}