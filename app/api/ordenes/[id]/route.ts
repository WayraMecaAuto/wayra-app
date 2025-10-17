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

    // Si hay servicios para actualizar
    if (servicios && Array.isArray(servicios)) {
      // Obtener servicios actuales
      const serviciosActuales = await prisma.servicioOrden.findMany({
        where: { ordenId: id }
      })

      // Identificar servicios nuevos y existentes
      const serviciosNuevos = servicios.filter((s: any) => s.isNew && !s.id)
      const serviciosExistentes = servicios.filter((s: any) => !s.isNew && s.id)

      // IDs de servicios que deben permanecer
      const idsServiciosActualizados = serviciosExistentes.map((s: any) => s.id)
      
      // Eliminar servicios que ya no están en la lista
      const serviciosAEliminar = serviciosActuales
        .filter(s => !idsServiciosActualizados.includes(s.id))
        .map(s => s.id)

      if (serviciosAEliminar.length > 0) {
        await prisma.servicioOrden.deleteMany({
          where: {
            id: { in: serviciosAEliminar }
          }
        })
      }

      // Actualizar servicios existentes (por si cambió el precio)
      for (const servicio of serviciosExistentes) {
        await prisma.servicioOrden.update({
          where: { id: servicio.id },
          data: {
            descripcion: servicio.descripcion,
            precio: parseFloat(servicio.precio)
          }
        })
      }

      // Crear nuevos servicios
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

      // Recalcular totales
      const todosLosServicios = await prisma.servicioOrden.findMany({
        where: { ordenId: id }
      })
      
      const subtotalServicios = todosLosServicios.reduce((sum, s) => sum + s.precio, 0)
      ordenData.subtotalServicios = subtotalServicios
      
      // Obtener productos y repuestos para calcular total
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
        mecanico: {
          select: { name: true }
        },
        servicios: true
      }
    })

    // Si se marca como completada, registrar ingreso en contabilidad
    if (ordenData.estado === 'COMPLETADO' && ordenData.estado !== orden.estado) {
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
      })
      
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
        })
      }
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error('Error updating orden:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}