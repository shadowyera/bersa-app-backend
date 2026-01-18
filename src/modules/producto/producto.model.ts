// src/modules/producto/producto.model.ts
import { Schema, model, Document } from 'mongoose';

// Interfaz para la representación de un producto
interface Presentacion {
  nombre: string;
  unidades: number;
  precioUnitario: number;
  precioTotal: number;
}

interface ReglaPrecio {
  cantidadMinima: number;
  precioUnitario: number;
}

export interface Producto extends Document {
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: Schema.Types.ObjectId; // Referencia a la colección Categoria
  proveedorId?: Schema.Types.ObjectId;
  activo: boolean;
  unidadBase: string;
  presentaciones: Presentacion[];
  reglasPrecio: ReglaPrecio[];
  fechaVencimiento?: Date;
  imagenUrl?: string;
  codigo: string; // Campo para el código de barras (equivalente)
}

// Definición del esquema de Producto
const productoSchema = new Schema<Producto>({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },

  // Precio de la UNIDAD BASE (lo que vende el POS)
  precio: { type: Number, required: true },

  categoriaId: {
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true,
  },

  proveedorId: {
    type: Schema.Types.ObjectId,
    ref: 'Proveedor',
  },

  activo: { type: Boolean, default: true },

  // UNIDAD BASE DEL STOCK (UNIDAD, KG, LT, etc.)
  unidadBase: { type: String, required: true },

  /**
   * 🔥 PRESENTACIONES
   * - logística (cajas, packs)
   * - opcionalmente comerciales
   */
  presentaciones: [
    {
      nombre: { type: String, required: true },

      // Cuántas unidades base representa
      unidades: { type: Number, required: true },

      // Código de barras propio (caja / pack)
      codigoBarra: { type: String },

      // Si se puede vender como pack (opcional)
      vendible: { type: Boolean, default: false },

      // Precio SOLO si es vendible
      precio: { type: Number },
    },
  ],

  /**
   * 🔥 Reglas de precio por volumen (POS)
   */
  reglasPrecio: [
    {
      cantidadMinima: Number,
      precioUnitario: Number,
    },
  ],

  fechaVencimiento: { type: Date },
  imagenUrl: { type: String },

  // Código de barras de la UNIDAD BASE
  codigo: { type: String, required: true, unique: true },
});

// Crear y exportar el modelo de Producto
const ProductoModel = model<Producto>('Producto', productoSchema);

export default ProductoModel;
