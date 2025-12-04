import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repuestoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(
      session?.user?.role || ''
    )
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: ordenId, repuestoId } = await params
    const body = await request.json()
    const { precioVenta, cantidad } = body

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

    // Obtener repuesto para calcular nueva utilidad
    const repuesto = await prisma.repuestoExterno.findUnique({
      where: { id: repuestoId }
    })

    if (!repuesto) {
      return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
    }

    const nuevoSubtotal = precioVenta * cantidad
    const nuevaUtilidad = nuevoSubtotal - (repuesto.precioCompra * cantidad)

    // Actualizar el repuesto
    await prisma.repuestoExterno.update({
      where: { id: repuestoId },
      data: {
        precioVenta: parseFloat(precioVenta),
        precioUnitario: parseFloat(precioVenta),
        subtotal: nuevoSubtotal,
        utilidad: nuevaUtilidad
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
        subtotalRepuestosExternos: subtotalRepuestos,
        total
      }
    })

    return NextResponse.json({ message: 'Precio actualizado' })
  } catch (error) {
    console.error('Error actualizando precio:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}