import { Schema, model, Types } from 'mongoose'
import { ESTADO_DESPACHO_INTERNO } from './despacho-interno.types'

/* =====================================================
   Item de Despacho Interno
===================================================== */

const DespachoItemSchema = new Schema(
  {
    productoId: {
      type: Types.ObjectId,
      ref: 'Producto',
      required: true,
    },

    cantidadDespachada: {
      type: Number,
      required: true,
      min: 1,
    },

    unidadPedido: {
      type: String,
      required: true,
    },

    factorUnidad: {
      type: Number,
      required: true,
      min: 1,
    },

    cantidadBaseDespachada: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false, // los items no necesitan _id propio
  }
)

/* =====================================================
   Despacho Interno
===================================================== */

const DespachoInternoSchema = new Schema(
  {
    /**
     * Pedido interno asociado (opcional).
     * - Existe si el despacho nace desde un pedido
     * - No existe en despachos urgentes / manuales
     */
    pedidoInternoId: {
      type: Types.ObjectId,
      ref: 'PedidoInterno',
      default: null,
    },

    /**
     * Sucursal que despacha (normalmente MAIN)
     */
    sucursalOrigenId: {
      type: Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    /**
     * Sucursal que recibe el despacho
     */
    sucursalDestinoId: {
      type: Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    /**
     * Estado logístico del despacho
     *
     * Flujo normal:
     * - DESPACHADO → RECIBIDO
     */
    estado: {
      type: String,
      enum: Object.values(ESTADO_DESPACHO_INTERNO),
      default: ESTADO_DESPACHO_INTERNO.DESPACHADO,
      required: true,
      index: true,
    },

    /**
     * Observación opcional ingresada
     * al despachar o al recibir
     */
    observacion: {
      type: String,
      default: null,
    },

    /**
     * Ítems despachados
     */
    items: {
      type: [DespachoItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message:
          'El despacho debe tener al menos un item',
      },
    },
  },
  {
    timestamps: true,
  }
)

/* =====================================================
   Model
===================================================== */

export const DespachoInternoModel = model(
  'DespachoInterno',
  DespachoInternoSchema
)