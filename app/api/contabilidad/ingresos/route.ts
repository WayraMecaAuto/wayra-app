import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')

    // Obtener ingresos de órdenes completadas
    let whereClause: any = {
      estado: 'COMPLETADO'
    }

    if (mes && año) {
      whereClause.mes = parseInt(mes)
      whereClause.anio = parseInt(año)
    }

    const ordenesCompletadas = await prisma.ordenServicio.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: { nombre: true }
        },
        vehiculo: {
          select: { placa: true, marca: true, modelo: true }
        }
      },
      orderBy: { fechaFin: 'desc' }
    })

    const ingresos = ordenesCompletadas.map(orden => ({
      id: orden.id,
      fecha: orden.fechaFin || orden.fechaCreacion,
      concepto: `Orden ${orden.numeroOrden} - ${orden.cliente.nombre}`,
      descripcion: `${orden.vehiculo.marca} ${orden.vehiculo.modelo} (${orden.vehiculo.placa})`,
      monto: orden.total,
      utilidad: orden.utilidad,
      tipo: 'ORDEN_SERVICIO'
    }))

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, ingreso) => sum + ingreso.monto, 0)
    const totalUtilidad = ingresos.reduce((sum, ingreso) => sum + ingreso.utilidad, 0)

    return NextResponse.json({
      ingresos,
      totales: {
        totalIngresos,
        totalUtilidad,
        cantidad: ingresos.length
      }
    })
  } catch (error) {
    console.error('Error fetching ingresos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}