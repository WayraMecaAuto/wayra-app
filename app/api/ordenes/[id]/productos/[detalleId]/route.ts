import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: ordenId, detalleId } = await params

    // Obtener detalle antes de eliminar
    const detalle = await prisma.detalleOrden.findUnique({
      where: { id: detalleId }
    })

    if (!detalle) {
      return NextResponse.json({ error: 'Detalle no encontrado' }, { status: 404 })
    }

    // Devolver stock
    await prisma.producto.update({
      where: { id: detalle.productoId },
      data: {
        stock: {
          increment: detalle.cantidad
        }
      }
    })

    // Eliminar detalle
    await prisma.detalleOrden.delete({
      where: { id: detalleId }
    })

    // Recalcular totales
    const servicios = await prisma.servicioOrden.findMany({ where: { ordenId } })
    const detalles = await prisma.detalleOrden.findMany({ where: { ordenId } })
    const repuestos = await prisma.repuestoExterno.findMany({ where: { ordenId } })
    const orden = await prisma.ordenServicio.findUnique({ where: { id: ordenId } })

    const subtotalServicios = servicios.reduce((sum, s) => sum + s.precio, 0)
    const subtotalProductos = detalles.reduce((sum, d) => sum + d.subtotal, 0)
    const subtotalRepuestos = repuestos.reduce((sum, r) => sum + r.subtotal, 0)
    const total = subtotalServicios + subtotalProductos + subtotalRepuestos + (orden?.manoDeObra || 0)

    await prisma.ordenServicio.update({
      where: { id: ordenId },
      data: {
        subtotalProductos,
        total
      }
    })

    return NextResponse.json({ message: 'Producto eliminado y stock devuelto' })
  } catch (error) {
    console.error('Error deleting producto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}