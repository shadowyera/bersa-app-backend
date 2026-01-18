import { Types } from 'mongoose';
import { PagoModel } from './pago.model';
import { VentaModel } from '../venta/venta.model';
import { TIPO_PAGO } from '../../shared/enums/tipoPago.enum';
import {
  AperturaCajaModel,
  ESTADO_APERTURA_CAJA,
} from '../caja/aperturaCaja.model';

interface CrearPagoInput {
  ventaId: Types.ObjectId;
  tipo: TIPO_PAGO;
  monto: number;
}

export const registrarPagosVenta = async (
  ventaId: Types.ObjectId,
  pagos: CrearPagoInput[]
) => {
  const venta = await VentaModel.findById(ventaId);

  if (!venta) {
    throw new Error('Venta no encontrada');
  }

  // 🔥 OBTENER APERTURA ACTIVA DE LA CAJA
  const apertura = await AperturaCajaModel.findOne({
    cajaId: venta.cajaId,
    estado: ESTADO_APERTURA_CAJA.ABIERTA,
  });

  if (!apertura) {
    throw new Error('No existe una apertura activa');
  }

  // ================================
  // 1. Validar total de pagos
  // ================================
  const totalPagos = pagos.reduce(
    (sum, p) => sum + p.monto,
    0
  );

  if (totalPagos !== venta.total) {
    throw new Error(
      `Total de pagos (${totalPagos}) no coincide con total de venta (${venta.total})`
    );
  }

  // ================================
  // 2. Registrar pagos
  // ================================
  const pagosCreados = [];

  for (const pago of pagos) {
    const pagoCreado = await PagoModel.create({
      ventaId: venta._id,
      aperturaCajaId: apertura._id, // ✅ SIEMPRE ACTIVA
      sucursalId: venta.sucursalId,
      tipo: pago.tipo,
      monto: pago.monto,
    });

    pagosCreados.push(pagoCreado);
  }

  return pagosCreados;
};