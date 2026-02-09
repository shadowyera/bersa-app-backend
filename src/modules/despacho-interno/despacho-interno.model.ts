import { Schema, model, Types } from 'mongoose'
import {
  ESTADO_DESPACHO_INTERNO,
  ORIGEN_DESPACHO_INTERNO,
} from './despacho-interno.types'

/* =====================================================
   Subdocumento: Item Despachado (Snapshot)
   -----------------------------------------------------
   - Representa lo que REALMENTE salió de bodega
   - Puede venir del pedido o ser un suplente
===================================================== */

const DespachoItemSnapshotSchema = new Schema(
  {
    /**
     * Referencia técnica al producto
     * (solo para trazabilidad / kardex)
     */
    productoId: {
      type: Types.ObjectId,
      required: true,
    },

    /**
     * Nombre del producto al momento del despacho
     * (snapshot histórico)
     */
    productoNombre: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Cantidad despachada (unidad base del producto)
     */
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },

    /**
     * Origen del item dentro del despacho
     *
     * PEDIDO   → venía en el pedido original
     * SUPLENTE → agregado por bodega
     */
    origenItem: {
      type: String,
      enum: ['PEDIDO', 'SUPLENTE'],
      required: true,
    },
  },
  {
    _id: false,
  }
)

/* =====================================================
   Subdocumento: Snapshot de Pedido Interno
   (solo cuando origen === PEDIDO)
===================================================== */

const DespachoPedidoSnapshotSchema = new Schema(
  {
    /**
     * ID técnico del pedido original
     * (solo trazabilidad)
     */
    pedidoInternoId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * Número legible del pedido
     */
    numeroPedido: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Sucursal destino del pedido
     */
    sucursalDestinoId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * Items despachados asociados a ESTE pedido
     * (incluye PEDIDO y SUPLENTE)
     */
    items: {
      type: [DespachoItemSnapshotSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          Array.isArray(items) && items.length > 0,
        message:
          'El pedido despachado debe tener al menos un item',
      },
    },
  },
  {
    _id: false,
  }
)

/* =====================================================
   Schema principal: Despacho Interno
===================================================== */

const DespachoInternoSchema = new Schema(
  {
    /**
     * Origen del despacho
     *
     * PEDIDO  → nace desde uno o más pedidos
     * DIRECTO → despacho operativo sin pedido
     */
    origen: {
      type: String,
      enum: Object.values(ORIGEN_DESPACHO_INTERNO),
      required: true,
      index: true,
    },

    /**
     * Sucursal que despacha
     */
    sucursalOrigenId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * Pedidos incluidos en el despacho
     * (solo si origen === PEDIDO)
     */
    pedidos: {
      type: [DespachoPedidoSnapshotSchema],
      default: undefined,
    },

    /**
     * Items despachados directamente
     * (solo si origen === DIRECTO)
     */
    itemsDirectos: {
      type: [DespachoItemSnapshotSchema],
      default: undefined,
    },

    /**
     * Estado administrativo del despacho
     */
    estado: {
      type: String,
      enum: Object.values(ESTADO_DESPACHO_INTERNO),
      default: ESTADO_DESPACHO_INTERNO.CREADO,
      required: true,
      index: true,
    },

    /**
     * Usuario que realizó el despacho
     */
    creadoPorId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * Fecha de creación administrativa
     */
    creadoEn: {
      type: Date,
      required: true,
    },

    /**
     * Fecha efectiva de despacho
     */
    despachadoEn: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
)

/* =====================================================
   Validaciones de Dominio (CRÍTICAS)
===================================================== */

DespachoInternoSchema.pre('validate', function () {
  const despacho = this as any

  /* ---------- Origen PEDIDO ---------- */
  if (despacho.origen === ORIGEN_DESPACHO_INTERNO.PEDIDO) {
    if (!despacho.pedidos || despacho.pedidos.length === 0) {
      throw new Error(
        'Despacho de origen PEDIDO debe incluir pedidos'
      )
    }

    despacho.itemsDirectos = undefined
  }

  /* ---------- Origen DIRECTO ---------- */
  if (despacho.origen === ORIGEN_DESPACHO_INTERNO.DIRECTO) {
    if (
      !despacho.itemsDirectos ||
      despacho.itemsDirectos.length === 0
    ) {
      throw new Error(
        'Despacho DIRECTO debe incluir itemsDirectos'
      )
    }

    despacho.pedidos = undefined
  }
})

/* =====================================================
   Model
===================================================== */

export const DespachoInternoModel = model(
  'DespachoInterno',
  DespachoInternoSchema
)