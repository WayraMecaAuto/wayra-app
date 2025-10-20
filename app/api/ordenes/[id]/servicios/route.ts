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
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { descripcion, precio } = body

    if (!descripcion || !precio) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Crear servicio
    const servicio = await prisma.servicioOrden.create({
      data: {
        descripcion,
        precio: parseFloat(precio),
        aplicaIva: false,
        ordenId: id
      }
    })

    // Actualizar totales de la orden
    const servicios = await prisma.servicioOrden.findMany({
      where: { ordenId: id }
    })

    const subtotalServicios = servicios.reduce((sum, s) => sum + s.precio, 0)

    // Obtener otros subtotales
    const detalles = await prisma.detalleOrden.findMany({
      where: { ordenId: id }
    })
    const repuestos = await prisma.repuestoExterno.findMany({
      where: { ordenId: id }
    })

    const subtotalProductos = detalles.reduce((sum, d) => sum + d.subtotal, 0)
    const subtotalRepuestos = repuestos.reduce((sum, r) => sum + r.subtotal, 0)

    const orden = await prisma.ordenServicio.findUnique({
      where: { id }
    })

    const total = subtotalServicios + subtotalProductos + subtotalRepuestos + (orden?.manoDeObra || 0)

    await prisma.ordenServicio.update({
      where: { id },
      data: {
        subtotalServicios,
        total
      }
    })

    return NextResponse.json(servicio, { status: 201 })
  } catch (error) {
    console.error('Error creating servicio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}