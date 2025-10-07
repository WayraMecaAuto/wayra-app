import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')
  
  // Verificar conexión
  try {
    await prisma.$connect()
    console.log('✅ Conexión a la base de datos exitosa')
  } catch (error) {
    console.error('❌ Error de conexión:', error)
    throw error
  }

  // Crear usuarios del sistema
  console.log('👤 Creando usuarios del sistema...')
  
  // Super Usuario
  const superPassword = await bcrypt.hash('super123', 12)
  const superUser = await prisma.user.upsert({
    where: { email: 'super@wayra.com' },
    update: {},
    create: {
      email: 'super@wayra.com',
      name: 'Super Usuario',
      password: superPassword,
      role: UserRole.SUPER_USUARIO,
      isActive: true
    }
  })
  console.log('✅ Super Usuario creado:', superUser.email)

  // Admin Wayra Taller
  const adminTallerPassword = await bcrypt.hash('taller123', 12)
  const adminTaller = await prisma.user.upsert({
    where: { email: 'admin.taller@wayra.com' },
    update: {},
    create: {
      email: 'admin.taller@wayra.com',
      name: 'Admin Wayra Taller',
      password: adminTallerPassword,
      role: UserRole.ADMIN_WAYRA_TALLER,
      isActive: true
    }
  })
  console.log('✅ Admin Taller creado:', adminTaller.email)

  // Admin Wayra Productos
  const adminProductosPassword = await bcrypt.hash('productos123', 12)
  const adminProductos = await prisma.user.upsert({
    where: { email: 'admin.productos@wayra.com' },
    update: {},
    create: {
      email: 'admin.productos@wayra.com',
      name: 'Admin Wayra Productos',
      password: adminProductosPassword,
      role: UserRole.ADMIN_WAYRA_PRODUCTOS,
      isActive: true
    }
  })
  console.log('✅ Admin Productos creado:', adminProductos.email)

  // Admin TorniRepuestos
  const adminTorniPassword = await bcrypt.hash('torni123', 12)
  const adminTorni = await prisma.user.upsert({
    where: { email: 'admin@tornirepuestos.com' },
    update: {},
    create: {
      email: 'admin@tornirepuestos.com',
      name: 'Admin TorniRepuestos',
      password: adminTorniPassword,
      role: UserRole.ADMIN_TORNI_REPUESTOS,
      isActive: true
    }
  })
  console.log('✅ Admin TorniRepuestos creado:', adminTorni.email)

  // Mecánico
  const mecanicoPassword = await bcrypt.hash('mecanico123', 12)
  const mecanico = await prisma.user.upsert({
    where: { email: 'mecanico@wayra.com' },
    update: {},
    create: {
      email: 'mecanico@wayra.com',
      name: 'Juan Mecánico',
      password: mecanicoPassword,
      role: UserRole.MECANICO,
      isActive: true
    }
  })
  console.log('✅ Mecánico creado:', mecanico.email)

  // Vendedor Wayra
  const vendedorWayraPassword = await bcrypt.hash('vendedor123', 12)
  const vendedorWayra = await prisma.user.upsert({
    where: { email: 'vendedor.wayra@wayra.com' },
    update: {},
    create: {
      email: 'vendedor.wayra@wayra.com',
      name: 'María Vendedora Wayra',
      password: vendedorWayraPassword,
      role: UserRole.VENDEDOR_WAYRA,
      isActive: true
    }
  })
  console.log('✅ Vendedor Wayra creado:', vendedorWayra.email)

  // Vendedor TorniRepuestos
  const vendedorTorniPassword = await bcrypt.hash('vendedor123', 12)
  const vendedorTorni = await prisma.user.upsert({
    where: { email: 'vendedor.torni@tornirepuestos.com' },
    update: {},
    create: {
      email: 'vendedor.torni@tornirepuestos.com',
      name: 'Carlos Vendedor TorniRepuestos',
      password: vendedorTorniPassword,
      role: UserRole.VENDEDOR_TORNI,
      isActive: true
    }
  })
  console.log('✅ Vendedor TorniRepuestos creado:', vendedorTorni.email)

  // Crear configuraciones básicas del sistema
  console.log('⚙️  Creando configuraciones básicas...')
  const configuraciones = [
    // Configuraciones generales
    {
      clave: 'TASA_USD_COP',
      valor: '4000',
      descripcion: 'Tasa de cambio USD a COP para productos CALAN'
    },
    {
      clave: 'IVA_GENERAL',
      valor: '19',
      descripcion: 'Porcentaje de IVA general (19%)'
    },
    {
      clave: 'IVA_CALAN',
      valor: '15',
      descripcion: 'Porcentaje de IVA para productos CALAN (15%)'
    },
    
    // Configuraciones Wayra
    {
      clave: 'WAYRA_MARGEN_ENI',
      valor: '35',
      descripcion: 'Margen de ganancia para productos Wayra ENI'
    },
    {
      clave: 'WAYRA_MARGEN_CALAN',
      valor: '35',
      descripcion: 'Margen de ganancia para productos Wayra CALAN'
    },
    {
      clave: 'WAYRA_DESCUENTO_MINORISTA',
      valor: '3',
      descripcion: 'Descuento minorista Wayra'
    },
    {
      clave: 'WAYRA_DESCUENTO_MAYORISTA',
      valor: '10',
      descripcion: 'Descuento mayorista Wayra'
    },

    // Configuraciones TorniRepuestos
    {
      clave: 'TORNI_MARGEN_REPUESTOS',
      valor: '35',
      descripcion: 'Margen de ganancia para repuestos'
    },
    {
      clave: 'TORNI_MARGEN_FILTROS',
      valor: '25',
      descripcion: 'Margen de ganancia para filtros'
    },
    {
      clave: 'TORNI_MARGEN_LUBRICANTES',
      valor: '15',
      descripcion: 'Margen de ganancia para lubricantes'
    },
    {
      clave: 'TORNI_DESCUENTO_MINORISTA',
      valor: '2',
      descripcion: 'Descuento minorista TorniRepuestos'
    },
    {
      clave: 'TORNI_DESCUENTO_MAYORISTA',
      valor: '5',
      descripcion: 'Descuento mayorista TorniRepuestos'
    },

    // Configuraciones Tornillería
    {
      clave: 'TORNILLERIA_MARGEN',
      valor: '100',
      descripcion: 'Margen de ganancia para tornillería'
    },
    {
      clave: 'TORNILLERIA_DESCUENTO_MINORISTA',
      valor: '5',
      descripcion: 'Descuento minorista tornillería'
    },
    {
      clave: 'TORNILLERIA_DESCUENTO_MAYORISTA',
      valor: '10',
      descripcion: 'Descuento mayorista tornillería'
    },

    // Información de la empresa
    {
      clave: 'EMPRESA_NOMBRE',
      valor: 'Wayra & TorniRepuestos',
      descripcion: 'Nombre de la empresa'
    },
    {
      clave: 'EMPRESA_NIT',
      valor: '900123456-7',
      descripcion: 'NIT de la empresa'
    },
    {
      clave: 'EMPRESA_DIRECCION',
      valor: 'Calle 123 #45-67, Bogotá, Colombia',
      descripcion: 'Dirección de la empresa'
    },
    {
      clave: 'EMPRESA_TELEFONO',
      valor: '+57 1 234 5678',
      descripcion: 'Teléfono de la empresa'
    },
    {
      clave: 'EMPRESA_EMAIL',
      valor: 'info@wayra.com',
      descripcion: 'Email de la empresa'
    }
  ]

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: { valor: config.valor, descripcion: config.descripcion },
      create: config
    })
  }

  console.log('⚙️  Configuraciones creadas')
  console.log('')
  console.log('✅ Seed completado exitosamente!')
  console.log('')
  console.log('👥 USUARIOS CREADOS:')
  console.log('')
  console.log('🔑 SUPER USUARIO (Acceso Total):')
  console.log('   📧 Email: super@wayra.com')
  console.log('   🔐 Password: super123')
  console.log('')
  console.log('🔑 ADMIN WAYRA TALLER (Dashboard + Órdenes):')
  console.log('   📧 Email: admin.taller@wayra.com')
  console.log('   🔐 Password: taller123')
  console.log('')
  console.log('🔑 ADMIN WAYRA PRODUCTOS (Productos Wayra):')
  console.log('   📧 Email: admin.productos@wayra.com')
  console.log('   🔐 Password: productos123')
  console.log('')
  console.log('🔑 ADMIN TORNI REPUESTOS (Productos TorniRepuestos):')
  console.log('   📧 Email: admin@tornirepuestos.com')
  console.log('   🔐 Password: torni123')
  console.log('')
  console.log('🔑 MECÁNICO (Solo reportes):')
  console.log('   📧 Email: mecanico@wayra.com')
  console.log('   🔐 Password: mecanico123')
  console.log('')
  console.log('🔑 VENDEDOR WAYRA (Solo salidas Wayra):')
  console.log('   📧 Email: vendedor.wayra@wayra.com')
  console.log('   🔐 Password: vendedor123')
  console.log('')
  console.log('🔑 VENDEDOR TORNI (Solo salidas TorniRepuestos):')
  console.log('   📧 Email: vendedor.torni@tornirepuestos.com')
  console.log('   🔐 Password: vendedor123')
  console.log('')
  console.log('🎯 Sistema listo para Fase 1!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:')
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })