import { Types } from 'mongoose'
import { AperturaCajaModel } from '../aperturaCaja/aperturaCaja.model'
import { VentaModel } from '../../venta/venta.model'
import { UsuarioModel } from '../../usuario/usuario.model'
import { PagoModel } from '../../pago/pago.model'

/* =====================================================
   INPUT
===================================================== */

interface ListarAperturasAdminInput {
  from?: Date
  to?: Date
  page?: number
  limit?: number
}

/* =====================================================
   HELPERS
===================================================== */

const calcularEfectivoEsperado = (ventas: any[]) => {
  let total = 0

  for (const v of ventas) {
    if (!Array.isArray(v.pagos)) continue

    for (const p of v.pagos) {
      if (p.tipo === 'EFECTIVO') {
        total += p.monto
      }
    }
  }

  return total
}

/* =====================================================
   LISTAR APERTURAS (ADMIN) → PAGINADO
===================================================== */

export const listarAperturasAdmin = async (
  filtros: ListarAperturasAdminInput
) => {

  const query: any = {}

  if (filtros.from || filtros.to) {
    query.fechaApertura = {}
    if (filtros.from) query.fechaApertura.$gte = filtros.from
    if (filtros.to) query.fechaApertura.$lte = filtros.to
  }

  const page = filtros.page ?? 1
  const limit = filtros.limit ?? 10
  const skip = (page - 1) * limit

  const [aperturas, total] = await Promise.all([

    AperturaCajaModel.find(query)
      .sort({ fechaApertura: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    AperturaCajaModel.countDocuments(query),

  ])

  if (aperturas.length === 0) {
    return {
      data: [],
      page,
      totalPages: 0,
    }
  }

  /* ================= OBTENER VENTAS ================= */

  const aperturaIds = aperturas.map(a => a._id)

  const ventas = await VentaModel.find({
    aperturaCajaId: { $in: aperturaIds }
  })
    .sort({ createdAt: 1 })
    .lean()

  /* ================= OBTENER PAGOS ================= */

  const ventaIds = ventas.map(v => v._id)

  const pagos = await PagoModel.find({
    ventaId: { $in: ventaIds }
  }).lean()

  const pagosPorVenta = new Map<string, any[]>()

  for (const p of pagos) {
    const key = String(p.ventaId)
    if (!pagosPorVenta.has(key)) {
      pagosPorVenta.set(key, [])
    }
    pagosPorVenta.get(key)!.push(p)
  }

  /* ================= OBTENER USUARIOS ================= */

  const usuariosIds = new Set<string>()

  aperturas.forEach(a => {
    if (a.usuarioAperturaId)
      usuariosIds.add(String(a.usuarioAperturaId))
    if (a.usuarioCierreId)
      usuariosIds.add(String(a.usuarioCierreId))
  })

  const usuarios = await UsuarioModel.find({
    _id: { $in: Array.from(usuariosIds) }
  })
    .select('_id nombre')
    .lean()

  const usuariosMap = new Map<string, string>()

  usuarios.forEach(u => {
    usuariosMap.set(String(u._id), u.nombre)
  })

  /* ================= AGRUPAR VENTAS POR APERTURA ================= */

  const ventasPorApertura = new Map<string, any[]>()

  for (const v of ventas) {
    const key = String(v.aperturaCajaId)
    if (!ventasPorApertura.has(key)) {
      ventasPorApertura.set(key, [])
    }
    ventasPorApertura.get(key)!.push(v)
  }

  /* ================= ARMAR DTO ================= */

  const data = aperturas.map(apertura => {

    const ventasApertura =
      ventasPorApertura.get(String(apertura._id)) || []

    const ventasConPagos = ventasApertura.map(v => ({
      ...v,
      pagos: pagosPorVenta.get(String(v._id)) || [],
    }))

    const totalCobrado = ventasApertura.reduce(
      (sum, v) => sum + (v.totalCobrado || 0),
      0
    )

    const efectivoEsperado =
      calcularEfectivoEsperado(ventasConPagos)

    const diferencia =
      apertura.montoFinal != null &&
      apertura.montoInicial != null
        ? (apertura.montoFinal - apertura.montoInicial) - efectivoEsperado
        : 0

    return {
      aperturaId: apertura._id,

      cajaId: apertura.cajaId,
      sucursalId: apertura.sucursalId,

      usuarioAperturaId: apertura.usuarioAperturaId,
      usuarioCierreId: apertura.usuarioCierreId,

      usuarioAperturaNombre:
        usuariosMap.get(String(apertura.usuarioAperturaId)) || null,

      usuarioCierreNombre:
        usuariosMap.get(String(apertura.usuarioCierreId)) || null,

      fechaApertura: apertura.fechaApertura,
      fechaCierre: apertura.fechaCierre,
      estado: apertura.estado,

      totalVentas: ventasApertura.length,
      totalCobrado,

      diferencia,
      motivoDiferencia: apertura.motivoDiferencia,

      ventas: ventasConPagos.map(v => ({
        _id: v._id,
        folio: v.folio,
        numeroVenta: v.numeroVenta,
        total: v.total,
        totalCobrado: v.totalCobrado,
        estado: v.estado,
        createdAt: v.createdAt,
        pagos: v.pagos.map((p: any) => ({
          tipo: p.tipo,
          monto: p.monto,
        }))
      })),

    }
  })

  return {
    data,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/* =====================================================
   DETALLE APERTURA (ADMIN)
===================================================== */

export const obtenerAperturaAdminDetalle = async (
  aperturaId: string
) => {

  const apertura = await AperturaCajaModel
    .findById(aperturaId)
    .lean()

  if (!apertura) {
    throw new Error('Apertura no encontrada')
  }

  const ventas = await VentaModel.find({
    aperturaCajaId: apertura._id,
  })
    .sort({ createdAt: 1 })
    .lean()

  const ventaIds = ventas.map(v => v._id)

  const pagos = await PagoModel.find({
    ventaId: { $in: ventaIds }
  }).lean()

  const pagosPorVenta = new Map<string, any[]>()

  for (const p of pagos) {
    const key = String(p.ventaId)
    if (!pagosPorVenta.has(key)) {
      pagosPorVenta.set(key, [])
    }
    pagosPorVenta.get(key)!.push(p)
  }

  const ventasConPagos = ventas.map(v => ({
    ...v,
    pagos: pagosPorVenta.get(String(v._id)) || [],
  }))

  const usuarios = await UsuarioModel.find({
    _id: {
      $in: [
        apertura.usuarioAperturaId,
        apertura.usuarioCierreId,
      ].filter(Boolean)
    }
  })
    .select('_id nombre')
    .lean()

  const usuariosMap = new Map<string, string>()

  usuarios.forEach(u => {
    usuariosMap.set(String(u._id), u.nombre)
  })

  const totalCobrado = ventas.reduce(
    (sum, v) => sum + (v.totalCobrado || 0),
    0
  )

  const efectivoEsperado =
    calcularEfectivoEsperado(ventasConPagos)

  const diferencia =
    apertura.montoFinal != null &&
    apertura.montoInicial != null
      ? (apertura.montoFinal - apertura.montoInicial) - efectivoEsperado
      : 0

  return {
    aperturaId: apertura._id,

    usuarioAperturaNombre:
      usuariosMap.get(String(apertura.usuarioAperturaId)) || null,

    usuarioCierreNombre:
      usuariosMap.get(String(apertura.usuarioCierreId)) || null,

    fechaApertura: apertura.fechaApertura,
    fechaCierre: apertura.fechaCierre,
    estado: apertura.estado,

    totalVentas: ventas.length,
    totalCobrado,

    diferencia,
    motivoDiferencia: apertura.motivoDiferencia,

    ventas: ventasConPagos.map(v => ({
      id: v._id,
      folio: v.folio,
      numeroVenta: v.numeroVenta,
      total: v.total,
      totalCobrado: v.totalCobrado,
      estado: v.estado,
      documentoTributario: v.documentoTributario,
      usuarioId: v.usuarioId,
      cajaId: v.cajaId,
      sucursalId: v.sucursalId,
      createdAt: v.createdAt,
      pagos: v.pagos.map((p: any) => ({
        tipo: p.tipo,
        monto: p.monto,
      }))
    })),

  }
}