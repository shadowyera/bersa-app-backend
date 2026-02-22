import { Router } from 'express'
import { listarAperturasAdminController, obtenerAperturaAdminDetalleController } from './aperturasAdmin.controller'
import { authMiddleware } from '../../auth/auth.middleware'

const router = Router()

/* =====================================================
   ADMIN - LISTAR APERTURAS CON VENTAS
   GET /api/admin/aperturas
===================================================== */

router.get(
    '/api/admin/aperturas',
    authMiddleware,
    listarAperturasAdminController
)

router.get(
    '/api/admin/aperturas/:id',
    authMiddleware,
    obtenerAperturaAdminDetalleController
)

export default router