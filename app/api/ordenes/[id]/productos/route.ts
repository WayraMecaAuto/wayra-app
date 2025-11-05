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
    const { productoId, cantidad, precioUnitario, tipoPrecio } = await request.json()

    if (!productoId || !cantidad || !precioUnitario) {
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
    }

    // Verificar stock
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    })

    if (!producto || producto.stock < cantidad) {
      return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 })
    }

    // Crear detalle
    await prisma.detalleOrden.create({
      data: {
        ordenId,
        productoId,
        cantidad,
        precioUnitario,
        tipoPrecio: tipoPrecio || 'VENTA',
        subtotal: precioUnitario * cantidad
      }
    })

    // Actualizar stock
    await prisma.producto.update({
      where: { id: productoId },
      data: { stock: { decrement: cantidad } }
    })

    // Movimiento inventario
    await prisma.movimientoInventario.create({
      data: {
        tipo: 'SALIDA',
        cantidad,
        motivo: `Agregado a orden ${ordenId}`,
        precioUnitario,
        total: precioUnitario * cantidad,
        productoId,
        usuarioId: session.user.id
      }
    })

    // Actualizar totales de la orden
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
        subtotalProductos,
        total
      }
    })

    return NextResponse.json({ message: 'Producto agregado' }, { status: 201 })
  } catch (error) {
    console.error('Error agregando producto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}