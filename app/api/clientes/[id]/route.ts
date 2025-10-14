import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

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

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        vehiculos: {
          where: { isActive: true },
          select: { id: true, placa: true, marca: true, modelo: true }
        },
        _count: {
          select: { ordenes: true }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error fetching cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre,
        telefono,
        email,
        direccion,
        tipoDocumento,
        numeroDocumento,
        updatedAt: new Date()
      },
      include: {
        vehiculos: {
          where: { isActive: true },
          select: { id: true, placa: true, marca: true, modelo: true }
        }
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error updating cliente:', error)
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

    // Verificar si el cliente tiene órdenes asociadas
    const ordenesCount = await prisma.ordenServicio.count({
      where: { clienteId: params.id }
    })

    if (ordenesCount > 0) {
      // Soft delete si tiene órdenes asociadas
      const cliente = await prisma.cliente.update({
        where: { id: params.id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      })
      return NextResponse.json({ 
        message: 'Cliente desactivado exitosamente', 
        cliente 
      })
    } else {
      // Hard delete si no tiene órdenes
      await prisma.cliente.delete({
        where: { id: params.id }
      })
      return NextResponse.json({ 
        message: 'Cliente eliminado exitosamente' 
      })
    }
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}