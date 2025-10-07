import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')

    let where: any = { isActive: true }
    if (clienteId) {
      where.clienteId = clienteId
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      include: {
        cliente: {
          select: { nombre: true }
        },
        _count: {
          select: { ordenes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(vehiculos)
  } catch (error) {
    console.error('Error fetching vehiculos:', error)
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
      clienteId,
      placa,
      marca,
      modelo,
      anio,
      color,
      vin,
      motor,
      combustible,
      kilometraje,
      observaciones
    } = body

    if (!clienteId || !placa || !marca || !modelo) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Verificar que la placa no exista
    const existingVehiculo = await prisma.vehiculo.findUnique({
      where: { placa }
    })

    if (existingVehiculo) {
      return NextResponse.json({ error: 'Ya existe un vehículo con esta placa' }, { status: 400 })
    }

    const vehiculo = await prisma.vehiculo.create({
      data: {
        clienteId,
        placa: placa.toUpperCase(),
        marca,
        modelo,
        anio: anio ? parseInt(anio) : null,
        color,
        vin,
        motor,
        combustible,
        kilometraje: kilometraje ? parseInt(kilometraje) : null,
        observaciones
      },
      include: {
        cliente: {
          select: { nombre: true }
        }
      }
    })

    return NextResponse.json(vehiculo, { status: 201 })
  } catch (error) {
    console.error('Error creating vehiculo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}