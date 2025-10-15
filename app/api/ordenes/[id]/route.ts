import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const orden = await prisma.ordenServicio.findUnique({
      where: { id },
      include: {
        cliente: true,
        vehiculo: true,
        mecanico: {
          select: { id: true, name: true }
        },
        servicios: true,
        detalles: {
          include: {
            producto: true
          }
        },
        repuestosExternos: true
      }
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error fetching orden:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const orden = await prisma.ordenServicio.update({
      where: { id },
      data: body,
      include: {
        cliente: true,
        vehiculo: true,
        mecanico: {
          select: { name: true }
        }
      }
    })

    // Si se marca como completada, registrar ingreso en contabilidad
    if (body.estado === 'COMPLETADO' && body.estado !== orden.estado) {
      // Registrar en contabilidad Wayra
      await prisma.movimientoContable.create({
        data: {
          tipo: 'INGRESO',
          concepto: 'VENTA_SERVICIO',
          monto: orden.total,
          fecha: new Date(),
          descripcion: `Ingreso por orden ${orden.numeroOrden} - ${orden.cliente.nombre}`,
          entidad: 'WAYRA',
          referencia: orden.id,
          usuarioId: session.user.id
        }
      });
      
      // Registrar en contabilidad Tornirepuestos si hay productos
      if (orden.subtotalProductos > 0) {
        await prisma.movimientoContable.create({
          data: {
            tipo: 'INGRESO',
            concepto: 'VENTA_PRODUCTO',
            monto: orden.subtotalProductos,
            fecha: new Date(),
            descripcion: `Venta de productos en orden ${orden.numeroOrden}`,
            entidad: 'TORNIREPUESTOS',
            referencia: orden.id,
            usuarioId: session.user.id
          }
        });
      }
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error updating orden:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}