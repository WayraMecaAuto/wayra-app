import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repuestoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: ordenId, repuestoId } = await params

    // Eliminar repuesto
    await prisma.repuestoExterno.delete({
      where: { id: repuestoId }
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
        subtotalRepuestosExternos: subtotalRepuestos,
        total
      }
    })

    return NextResponse.json({ message: 'Repuesto eliminado' })
  } catch (error) {
    console.error('Error deleting repuesto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}