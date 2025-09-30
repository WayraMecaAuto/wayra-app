import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const configuraciones = await prisma.configuracion.findMany({
      orderBy: { clave: 'asc' }
    })

    return NextResponse.json(configuraciones)
  } catch (error) {
    console.error('Error fetching configuraciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { clave, valor } = await request.json()

    if (!clave || valor === undefined) {
      return NextResponse.json({ error: 'Clave y valor son requeridos' }, { status: 400 })
    }

    const configuracion = await prisma.configuracion.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor, descripcion: '' }
    })

    return NextResponse.json(configuracion)
  } catch (error) {
    console.error('Error updating configuracion:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}