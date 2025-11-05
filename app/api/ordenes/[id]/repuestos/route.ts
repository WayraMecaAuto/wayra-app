import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: ordenId } = await params
    const body = await request.json()
    const { nombre, descripcion, cantidad, precioCompra, precioVenta, proveedor, subtotal, utilidad } = body

    await prisma.repuestoExterno.create({
      data: {
        nombre,
        descripcion: descripcion || '',
        cantidad,
        precioCompra: precioCompra || 0,
        precioVenta,
        precioUnitario: precioVenta,
        subtotal,
        utilidad: utilidad || 0,
        proveedor: proveedor || '',
        ordenId
      }
    })

    // Actualizar totales
    const detalles = await prisma.detalleOrden.findMany({ where: { ordenId } })
    const servicios = await prisma.servicioOrden.findMany({ where: { ordenId } })
    const repuestos = await prisma.repuestoExterno.findMany({ where: { ordenId } })
    const orden = await prisma.ordenServicio.findUnique({ where: { id: ordenId } })

    const subtotalProductos = detalles.reduce((sum, d) => sum + d.subtotal, 0)
    const subtotalServicios = servicios.reduce((sum, s) => sum + s.precio, 0)
    const subtotalRepuestos = repuestos.reduce((sum, r) => sum + r.subtotal, 0)
    const total = subtotalProductos + subtotalServicios + subtotalRepuestos + (orden?.manoDeObra || 0)

    await prisma.ordenServicio.update({
      where: { id: ordenId },
      data: {
        subtotalRepuestosExternos: subtotalRepuestos,
        total
      }
    })

    return NextResponse.json({ message: 'Repuesto agregado' }, { status: 201 })
  } catch (error) {
    console.error('Error agregando repuesto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}