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

    const clientes = await prisma.cliente.findMany({
      where: { isActive: true },
      include: {
        vehiculos: {
          where: { isActive: true },
          select: { id: true, placa: true, marca: true, modelo: true }
        },
        _count: {
          select: { ordenes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      telefono,
      email,
      direccion,
      tipoDocumento,
      numeroDocumento
    } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        email,
        direccion,
        tipoDocumento: tipoDocumento || 'CC',
        numeroDocumento
      }
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}