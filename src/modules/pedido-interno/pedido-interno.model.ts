import { Schema, model, Types } from 'mongoose'
import { ESTADO_PEDIDO_INTERNO } from './pedido-interno.types'

/* =====================================================
   Subdocumento: Item de Pedido Interno
   (snapshot de producto incluido)
===================================================== */

const PedidoInternoItemSchema = new Schema(
  {
    /**
     * Referencia técnica al producto
     * (se mantiene para trazabilidad y despacho)
     */
    productoId: {
      type: Types.ObjectId,
      ref: 'Producto',
      required: true,
    },

    /**
     * SNAPSHOT del nombre del producto
     * (para que el pedido sea legible históricamente)
     */
    productoNombre: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Unidad base del producto al momento del pedido
     * (ej: UNIDAD, KG, LITRO)
     */
    unidadBase: {
      type: String,
      required: true,
      trim: true,
    },

    /** Cantidad solicitada por la sucursal destino */
    cantidadSolicitada: {
      type: Number,
      required: true,
      min: 1,
    },

    /** Unidad en la que se solicita (CAJA, UNIDAD, etc.) */
    unidadPedido: {
      type: String,
      required: true,
      trim: true,
    },

    /** Factor de conversión a unidad base */
    factorUnidad: {
      type: Number,
      required: true,
      min: 1,
    },

    /** Cantidad solicitada expresada en unidad base */
    cantidadBaseSolicitada: {
      type: Number,
      required: true,
      min: 1,
    },

    /**
     * Cantidad efectivamente preparada por bodega.
     *
     * - Puede ser menor a la solicitada
     * - Puede ser 0
     * - Puede no existir
     */
    cantidadPreparada: {
      type: Number,
      min: 0,
      default: undefined,
    },
  },
  {
    _id: false, // item embebido, no necesita _id propio
  }
)

/* =====================================================
   Schema principal: Pedido Interno
===================================================== */

const PedidoInternoSchema = new Schema(
  {
    /** Sucursal que solicita el pedido */
    sucursalSolicitanteId: {
      type: Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    /** Sucursal que abastece (normalmente MAIN) */
    sucursalAbastecedoraId: {
      type: Types.ObjectId,
      ref: 'Sucursal',
      required: true,
      index: true,
    },

    /**
     * Estado del pedido interno
     *
     * Flujo normal:
     * - CREADO → PREPARADO → DESPACHADO
     *
     * Flujo alternativo:
     * - CREADO → CANCELADO
     */
    estado: {
      type: String,
      enum: Object.values(ESTADO_PEDIDO_INTERNO),
      default: ESTADO_PEDIDO_INTERNO.CREADO,
      required: true,
      index: true,
    },

    /** Items solicitados */
    items: {
      type: [PedidoInternoItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message:
          'El pedido interno debe tener al menos un item',
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

export const PedidoInternoModel = model(
  'PedidoInterno',
  PedidoInternoSchema
)