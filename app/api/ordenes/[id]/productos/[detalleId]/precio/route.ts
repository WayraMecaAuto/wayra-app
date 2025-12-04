import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detalleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(
      session?.user?.role || ''
    )
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: ordenId, detalleId } = await params
    const body = await request.json()
    const { precioUnitario, cantidad } = body

    // Verificar que la orden no esté completada
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId }
    })

    if (orden?.estado === 'COMPLETADO') {
      return NextResponse.json(
        { error: 'No se pueden modificar órdenes completadas' },
        { status: 403 }
      )
    }

    // Actualizar el detalle
    const nuevoSubtotal = precioUnitario * cantidad
    await prisma.detalleOrden.update({
      where: { id: detalleId },
      data: {
        precioUnitario: parseFloat(precioUnitario),
        subtotal: nuevoSubtotal
      }
    })

    // Recalcular totales
    const servicios = await prisma.servicioOrden.findMany({ where: { ordenId } })
    const detalles = await prisma.detalleOrden.findMany({ where: { ordenId } })
    const repuestos = await prisma.repuestoExterno.findMany({ where: { ordenId } })

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

    return NextResponse.json({ message: 'Precio actualizado' })
  } catch (error) {
    console.error('Error actualizando precio:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}