import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

/* ===============================
   Routes
=============================== */
import { authRoutes } from './modules/auth/auth.routes'
import { authMiddleware } from './modules/auth/auth.middleware'

import sucursalRoutes from './modules/sucursal/sucursal.routes'
import productsRoutes from './modules/producto/producto.routes'
import categoriaRoutes from './modules/categoria/categoria.routes'
import movimientoRoutes from './modules/movimiento/movimiento.routes'
import stockRoutes from './modules/stock/stock.routes'
import ventaRoutes from './modules/venta/venta.routes'
import cajaRoutes from './modules/caja/caja.routes'
import aperturaCajaRoutes from './modules/caja/aperturaCaja/aperturaCaja.routes'
import cierreCajaRoutes from './modules/caja/cierreCaja/cierreCaja.routes'
import corteCajaRoutes from './modules/caja/corteCaja/corteCaja.routes'
import pagoRoutes from './modules/pago/pago.routes'
import proveedorRoutes from './modules/proveedor/proveedor.routes'
import realtimeRoutes from './modules/realtime/realtime.routes'
import abastecimientoRoutes from './modules/abastecimiento/abastecimiento.routes'
import pedidoInternoRoutes from './modules/pedido-interno/pedido-interno.routes'
import despachoInternoRoutes from './modules/despacho-interno/despacho-interno.routes'
import aperturasActivasRoutes from './modules/caja/queries/aperturasActivas.routes'

dotenv.config()

/* ===============================
   App
=============================== */
const app = express()
const port = process.env.PORT || 5000
const mongoUri = process.env.MONGO_URI

if (!mongoUri) {
   throw new Error('La variable de entorno MONGO_URI no está definida')
}

/* ===============================
   Middlewares base
=============================== */

// CORS (IMPORTANTE: credentials true para SSE + cookies)
app.use(cors({
   origin: true,
   credentials: true
}))

app.use(express.json())
app.use(cookieParser())

/* ===============================
   Rutas públicas
=============================== */
app.use('/auth', authRoutes)

/* ===============================
   Auth global (JWT)
   - lee token desde cookie httpOnly
=============================== */
app.use(authMiddleware)

/* ===============================
   Headers comunes API
=============================== */
app.use('/api', (_req, res, next) => {
   res.setHeader('Cache-Control', 'no-store')
   next()
})

/* ===============================
   Realtime (SSE)
=============================== */
app.use('/api/realtime', realtimeRoutes)

/* ===============================
   Rutas protegidas
=============================== */
app.use(sucursalRoutes)
app.use(productsRoutes)
app.use(categoriaRoutes)
app.use(movimientoRoutes)
app.use(stockRoutes)
app.use(ventaRoutes)
app.use(cajaRoutes)
app.use(aperturaCajaRoutes)
app.use(cierreCajaRoutes)
app.use(corteCajaRoutes)
app.use(aperturasActivasRoutes)
app.use(pagoRoutes)
app.use(proveedorRoutes)
app.use(abastecimientoRoutes)
app.use(pedidoInternoRoutes)
app.use(despachoInternoRoutes)

/* ===============================
   Mongo + Server
=============================== */
mongoose
   .connect(mongoUri)
   .then(() => {
      console.log('✅ Conectado a MongoDB')
      app.listen(port, () => {
         console.log(`🚀 Servidor corriendo en http://localhost:${port}`)
      })
   })
   .catch((error) => {
      console.error('❌ Error al conectar a MongoDB:', error)
   })