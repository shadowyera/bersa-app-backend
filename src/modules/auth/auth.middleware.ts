import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

import SucursalModel from '../sucursal/sucursal.model'
import { ROL_USUARIO } from '../usuario/usuario.model'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    /* =====================================================
       TOKEN
    ===================================================== */

    const token = req.cookies?.token

    console.log('\n================ AUTH =================')
    console.log('[AUTH] path:', req.path)
    console.log('[AUTH] method:', req.method)
    console.log('[AUTH] token exists:', !!token)

    if (!token) {
      console.log('[AUTH] ❌ No token')

      return res.status(401).json({
        message: 'No autorizado',
      })
    }

    /* =====================================================
       VERIFY JWT
    ===================================================== */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      _id: string
      nombre: string
      rol: ROL_USUARIO
      sucursalId: string
    }

    console.log('[AUTH] decoded:', decoded)

    /* =====================================================
       SUCURSAL
    ===================================================== */

    const sucursal = await SucursalModel.findById(
      decoded.sucursalId
    )
      .select('_id nombre esPrincipal activo')
      .lean()

    console.log('[AUTH] sucursal:', sucursal)

    if (!sucursal) {
      console.log('[AUTH] ❌ Sucursal no encontrada')

      return res.status(401).json({
        message: 'Sucursal inválida',
      })
    }

    if (sucursal.activo === false) {
      console.log('[AUTH] ❌ Sucursal inactiva')

      return res.status(401).json({
        message: 'Sucursal inactiva',
      })
    }

    /* =====================================================
       USER SESSION
    ===================================================== */

    req.user = {
      _id: decoded._id,

      nombre: decoded.nombre,

      rol: decoded.rol,

      sucursal: {
        id: sucursal._id.toString(),

        esPrincipal:
          sucursal.esPrincipal,
      },
    }

    console.log('[AUTH] req.user:', req.user)
    console.log('[AUTH] ✅ OK')
    console.log('=======================================\n')

    next()
  } catch (error) {
    console.error('\n[AUTH] ❌ ERROR')
    console.error(error)

    return res.status(401).json({
      message: 'Token inválido',
    })
  }
}