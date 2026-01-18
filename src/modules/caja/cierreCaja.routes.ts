import { Router } from 'express'
import {
  cerrarCajaController,
  resumenPrevioCajaController,
} from './cierreCaja.controller'

const router = Router()

router.get(
  '/api/cajas/:cajaId/resumen-previo',
  resumenPrevioCajaController
)

router.post(
  '/api/cajas/:cajaId/cerrar-automatico',
  cerrarCajaController
)

export default router