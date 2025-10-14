import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: params.id },
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true, email: true }
        },
        _count: {
          select: { ordenes: true }
        }
      }
    })
    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }
    return NextResponse.json(vehiculo)

  } catch (error) {
    console.error('Error fetching vehiculo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
){
  try {

    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
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

    if (!placa || !marca || !modelo) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const vehiculo = await prisma.vehiculo.update({
      where: { id: params.id },
      data: {
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
          select: { id: true, nombre: true, telefono: true, email: true }
        }
      }
    })

    return NextResponse.json(vehiculo)

  } catch (error) {
    console.error('Error updating vehiculo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const vehiculo = await prisma.vehiculo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Vehículo eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting vehiculo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}