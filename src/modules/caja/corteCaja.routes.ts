import { Router } from 'express'
import { getCorteCajerosController } from './corteCaja.controller'

const router = Router()

router.get(
  '/api/cajas/:cajaId/corte-cajeros',
  getCorteCajerosController
)

export default router