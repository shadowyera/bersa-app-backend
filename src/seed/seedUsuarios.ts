import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { UsuarioModel } from '../modules/usuario/usuario.model'
import SucursalModel from '../modules/sucursal/sucursal.model';

dotenv.config()

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI!)

  console.log('Conectado a Mongo')

  // Usamos la primera sucursal
  const sucursal = await SucursalModel.findOne()
  if (!sucursal) {
    throw new Error('No hay sucursales creadas')
  }

  await UsuarioModel.deleteMany({})

  const password = await bcrypt.hash('123456', 10)

  const usuarios = await UsuarioModel.create([
    {
      nombre: 'Admin Bersa',
      email: 'admin@bersa.cl',
      passwordHash: password,
      rol: 'ADMIN',
      sucursalId: sucursal._id,
    },
    {
      nombre: 'Juan Cajero',
      email: 'juan@bersa.cl',
      passwordHash: password,
      rol: 'CAJERO',
      sucursalId: sucursal._id,
    },
    {
      nombre: 'Maria Cajera',
      email: 'maria@bersa.cl',
      passwordHash: password,
      rol: 'CAJERO',
      sucursalId: sucursal._id,
    },
  ])

  console.log('Usuarios creados:')
  usuarios.forEach(u =>
    console.log(`${u.nombre} → ${u.email}`)
  )

  process.exit()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
