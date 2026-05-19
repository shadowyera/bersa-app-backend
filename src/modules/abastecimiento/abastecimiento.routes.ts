import { Router } from 'express'

import {
  createIngresoStock,
  getAbastecimientos,
  getAbastecimientoById,
} from './abastecimiento.controller'

const router = Router()

/* ======================================================
   POST
   Registrar ingreso de stock
====================================================== */

router.post(
  '/api/abastecimientos/ingreso',
  createIngresoStock
)

/* ======================================================
   GET
   Listado de abastecimientos
====================================================== */

router.get(
  '/api/abastecimientos',
  getAbastecimientos
)

/* ======================================================
   GET
   Detalle abastecimiento
====================================================== */

router.get(
  '/api/abastecimientos/:id',
  getAbastecimientoById
)

export default router