import { Request, Response } from 'express'

import {
  despacharPedidoInterno,
  crearDespachoManual,
  recibirDespachoInterno,
  listarDespachosInternos,
} from './despacho-interno.service'

import { DespachoInternoModel } from './despacho-interno.model'

/* =====================================================
   DESPACHAR PEDIDO INTERNO PREPARADO
   -----------------------------------------------------
   Flujo:
   - Se llama desde la sucursal ORIGEN (bodega / main)
   - El pedido ya debe estar en estado PREPARADO
   - Se crea un DespachoInterno asociado al pedido
   - Se descuenta stock de la sucursal origen
   - El despacho queda en estado DESPACHADO
===================================================== */
export async function despacharPedidoController(
  req: Request,
  res: Response
) {
  try {
    const despacho = await despacharPedidoInterno(
      req.params.pedidoId,
      req.user!.sucursalId
    )

    res.status(201).json(despacho)
  } catch (error: any) {
    res.status(400).json({
      message:
        error.message ??
        'Error al despachar pedido interno',
    })
  }
}

/* =====================================================
   CREAR DESPACHO MANUAL / URGENTE
   -----------------------------------------------------
   Flujo alternativo (sin pedido interno):
   - Usado para emergencias o ajustes operativos
   - No existe pedidoInternoId
   - Se descuenta stock directamente
   - El despacho queda en estado DESPACHADO
===================================================== */
export async function crearDespachoManualController(
  req: Request,
  res: Response
) {
  try {
    const {
      sucursalDestinoId,
      items,
      observacion,
    } = req.body

    /* -----------------------------
       Validaciones mínimas
    ------------------------------ */
    if (!sucursalDestinoId) {
      return res.status(400).json({
        message: 'Sucursal destino es requerida',
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          'El despacho debe contener al menos un item',
      })
    }

    const despacho = await crearDespachoManual({
      sucursalOrigenId: req.user!.sucursalId,
      sucursalDestinoId,
      items,
      observacion,
    })

    res.status(201).json(despacho)
  } catch (error: any) {
    res.status(400).json({
      message:
        error.message ??
        'Error al crear despacho manual',
    })
  }
}

/* =====================================================
   RECEPCIÓN DE DESPACHO
   -----------------------------------------------------
   Flujo:
   - Se ejecuta desde la sucursal DESTINO
   - El despacho debe estar en estado DESPACHADO
   - Se registran cantidades recibidas
   - Se ingresa stock en sucursal destino
   - El despacho pasa a estado RECIBIDO
===================================================== */
export async function recibirDespachoController(
  req: Request,
  res: Response
) {
  try {
    const { items, observacion } = req.body

    /* -----------------------------
       Validaciones básicas
    ------------------------------ */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message:
          'Debe indicar al menos un item recibido',
      })
    }

    await recibirDespachoInterno(
      req.params.id,           // despachoId
      req.user!.sucursalId,    // sucursal destino
      items,
      observacion
    )

    res.json({
      ok: true,
      message: 'Despacho recibido correctamente',
    })
  } catch (error: any) {
    res.status(400).json({
      message:
        error.message ??
        'Error al recibir despacho',
    })
  }
}

/* =====================================================
   LISTAR DESPACHOS INTERNOS
   -----------------------------------------------------
   Comportamiento según rol / sucursal:
   - Sucursal ORIGEN (MAIN): ve despachos salientes
   - Sucursal DESTINO: ve despachos entrantes
   - ADMIN: puede ver todos (según lógica del service)
===================================================== */
export async function listarDespachosController(
  req: Request,
  res: Response
) {
  try {
    const despachos = await listarDespachosInternos({
      rol: req.user!.rol,
      sucursalId: req.user!.sucursalId,
    })

    res.json(despachos)
  } catch (error: any) {
    res.status(400).json({
      message:
        error.message ??
        'Error al listar despachos',
    })
  }
}

/* =====================================================
   OBTENER DESPACHO POR ID
   -----------------------------------------------------
   Usado para:
   - Ver detalle completo
   - Pantallas de revisión / recepción
   - Mostrar origen y destino con nombre
===================================================== */
export async function getDespachoByIdController(
  req: Request,
  res: Response
) {
  try {
    const despacho = await DespachoInternoModel.findById(
      req.params.id
    )
      .populate('sucursalOrigenId', 'nombre')
      .populate('sucursalDestinoId', 'nombre')

    if (!despacho) {
      return res.status(404).json({
        message: 'Despacho no encontrado',
      })
    }

    res.json(despacho)
  } catch (error: any) {
    res.status(400).json({
      message:
        error.message ??
        'Error al obtener despacho',
    })
  }
}