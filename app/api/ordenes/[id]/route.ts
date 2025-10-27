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

    // Separar servicios del resto de datos
    const { servicios, ...ordenData } = body

    // Si es CANCELADO, eliminar la orden
    if (ordenData.estado === 'CANCELADO') {
      await prisma.ordenServicio.delete({
        where: { id }
      })
      return NextResponse.json({ message: 'Orden cancelada y eliminada' })
    }

    // Si hay servicios para actualizar
    if (servicios && Array.isArray(servicios)) {
      const serviciosActuales = await prisma.servicioOrden.findMany({
        where: { ordenId: id }
      })

      const serviciosNuevos = servicios.filter((s: any) => s.isNew && !s.id)
      const serviciosExistentes = servicios.filter((s: any) => !s.isNew && s.id)
      const idsServiciosActualizados = serviciosExistentes.map((s: any) => s.id)
      
      const serviciosAEliminar = serviciosActuales
        .filter(s => !idsServiciosActualizados.includes(s.id))
        .map(s => s.id)

      if (serviciosAEliminar.length > 0) {
        await prisma.servicioOrden.deleteMany({
          where: { id: { in: serviciosAEliminar } }
        })
      }

      for (const servicio of serviciosExistentes) {
        await prisma.servicioOrden.update({
          where: { id: servicio.id },
          data: {
            descripcion: servicio.descripcion,
            precio: parseFloat(servicio.precio)
          }
        })
      }

      if (serviciosNuevos.length > 0) {
        await prisma.servicioOrden.createMany({
          data: serviciosNuevos.map((s: any) => ({
            descripcion: s.descripcion,
            precio: parseFloat(s.precio),
            aplicaIva: false,
            ordenId: id
          }))
        })
      }

      const todosLosServicios = await prisma.servicioOrden.findMany({
        where: { ordenId: id }
      })
      
      const subtotalServicios = todosLosServicios.reduce((sum, s) => sum + s.precio, 0)
      ordenData.subtotalServicios = subtotalServicios
      
      const detalles = await prisma.detalleOrden.findMany({
        where: { ordenId: id }
      })
      const repuestos = await prisma.repuestoExterno.findMany({
        where: { ordenId: id }
      })
      
      const subtotalProductos = detalles.reduce((sum, d) => sum + d.subtotal, 0)
      const subtotalRepuestos = repuestos.reduce((sum, r) => sum + r.subtotal, 0)
      
      ordenData.subtotalProductos = subtotalProductos
      ordenData.subtotalRepuestosExternos = subtotalRepuestos
      ordenData.total = subtotalServicios + subtotalProductos + subtotalRepuestos + (ordenData.manoDeObra || 0)
    }

    // Actualizar la orden
    const orden = await prisma.ordenServicio.update({
      where: { id },
      data: ordenData,
      include: {
        cliente: true,
        vehiculo: true,
        mecanico: { select: { name: true } },
        servicios: true
      }
    })

    // Si se marca como COMPLETADA, NO registrar productos en contabilidad
    // Los productos ya se registraron cuando se agregaron a la orden
    if (ordenData.estado === 'COMPLETADO') {
      const ahora = new Date()
      const mes = ahora.getMonth() + 1
      const anio = ahora.getFullYear()

      // Solo registramos el total de la orden en Wayra Taller
      // (servicios + repuestos externos + mano de obra)
      // NO incluimos productos porque ya están en su contabilidad respectiva
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error updating orden:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}