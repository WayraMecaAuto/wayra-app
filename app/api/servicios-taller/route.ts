import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const serviciosConfig = await prisma.configuracion.findMany({
      where: {
        clave: {
          startsWith: 'SERVICIO_'
        }
      },
      orderBy: { clave: 'asc' }
    })

    const serviciosDefault = [
      { clave: 'SERVICIO_COMPLETO', valor: '150000', descripcion: 'Servicio Completo' },
      { clave: 'SERVICIO_ALINEACION', valor: '50000', descripcion: 'Alineación' },
      { clave: 'SERVICIO_BALANCEO', valor: '40000', descripcion: 'Balanceo' },
      { clave: 'SERVICIO_MONTAJE', valor: '25000', descripcion: 'Montaje' },
      { clave: 'SERVICIO_ROTACION', valor: '20000', descripcion: 'Rotación de llantas' },
      { clave: 'SERVICIO_LUBRICACION', valor: '80000', descripcion: 'Lubricación' },
      { clave: 'SERVICIO_ENGRASE', valor: '15000', descripcion: 'Engrase' }
    ]

    if (serviciosConfig.length === 0) {
      await prisma.configuracion.createMany({
        data: serviciosDefault
      })
      return NextResponse.json(serviciosDefault)
    }

    return NextResponse.json(serviciosConfig)
  } catch (error) {
    console.error('Error fetching servicios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// 🔥 ACTUALIZAR SERVICIOS (PATCH mantiene compatibilidad)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { servicios } = await request.json()

    for (const servicio of servicios) {
      await prisma.configuracion.upsert({
        where: { clave: servicio.clave },
        update: { valor: servicio.valor, descripcion: servicio.descripcion },
        create: { clave: servicio.clave, valor: servicio.valor, descripcion: servicio.descripcion }
      })
    }

    return NextResponse.json({ message: 'Servicios actualizados correctamente' })
  } catch (error) {
    console.error('Error updating servicios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// 🔥 NUEVO: CREAR SERVICIO
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { descripcion, precio } = await request.json()

    if (!descripcion || !precio) {
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
    }

    // Generar clave única
    const clave = `SERVICIO_${descripcion.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}`

    const nuevoServicio = await prisma.configuracion.create({
      data: {
        clave,
        valor: precio.toString(),
        descripcion
      }
    })

    return NextResponse.json(nuevoServicio, { status: 201 })
  } catch (error) {
    console.error('Error creating servicio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// 🔥 NUEVO: ELIMINAR SERVICIO
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clave = searchParams.get('clave')

    if (!clave) {
      return NextResponse.json({ error: 'Clave requerida' }, { status: 400 })
    }

    await prisma.configuracion.delete({
      where: { clave }
    })

    return NextResponse.json({ message: 'Servicio eliminado' })
  } catch (error) {
    console.error('Error deleting servicio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}