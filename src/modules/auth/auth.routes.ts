import { Router } from 'express'
import { loginController, meController, logoutController } from './auth.controller'
import { authMiddleware } from './auth.middleware'

export const authRoutes = Router()

// público
authRoutes.post('/login', loginController)

// protegido (usa cookie)
authRoutes.get('/me', authMiddleware, meController)

// logout (opcionalmente protegido)
authRoutes.post('/logout', authMiddleware, logoutController)