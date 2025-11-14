import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const incluirServicios = searchParams.get('incluirServicios') === 'true'
    const incluirMecanicos = searchParams.get('incluirMecanicos') === 'true'
    const incluirContabilidad = searchParams.get('incluirContabilidad') === 'true'

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Fechas requeridas' }, { status: 400 })
    }

    const canViewContabilidad = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

    const resultado: any = {}

    // Convertir fechas correctamente
    const fechaInicioDate = new Date(fechaInicio + 'T00:00:00')
    const fechaFinDate = new Date(fechaFin + 'T23:59:59')

    console.log('Generando reporte personalizado:', { fechaInicio: fechaInicioDate, fechaFin: fechaFinDate })

    // SERVICIOS
    if (incluirServicios) {
      try {
        const servicios = await prisma.$queryRaw<any[]>`
          SELECT 
            so.descripcion,
            COUNT(*) as cantidad,
            SUM(so.precio) as total
          FROM "servicios_orden" so
          INNER JOIN "ordenes_servicio" os ON so."ordenId" = os.id
          WHERE os.estado = 'COMPLETADO'
            AND os."fechaCreacion" >= ${fechaInicioDate}
            AND os."fechaCreacion" <= ${fechaFinDate}
          GROUP BY so.descripcion
          ORDER BY cantidad DESC
          LIMIT 20
        `

        resultado.servicios = servicios.map(s => ({
          descripcion: s.descripcion,
          cantidad: Number(s.cantidad),
          total: Number(s.total)
        }))

        console.log('Servicios encontrados:', resultado.servicios.length)
      } catch (error) {
        console.error('Error en servicios:', error)
        resultado.servicios = []
      }
    }

    // MECÁNICOS
    if (incluirMecanicos) {
      try {
        const ordenesAgrupadas = await prisma.ordenServicio.groupBy({
          by: ['mecanicoId'],
          where: {
            estado: 'COMPLETADO',
            fechaCreacion: {
              gte: fechaInicioDate,
              lte: fechaFinDate
            }
          },
          _count: { id: true },
          _sum: { total: true }
        })

        const mecanicosConNombres = await Promise.all(
          ordenesAgrupadas.map(async (m) => {
            const usuario = await prisma.user.findUnique({
              where: { id: m.mecanicoId },
              select: { name: true }
            })
            return {
              nombre: usuario?.name || 'Desconocido',
              ordenes: m._count.id,
              ingresos: m._sum.total || 0
            }
          })
        )

        resultado.mecanicos = mecanicosConNombres
          .sort((a, b) => b.ordenes - a.ordenes)
          .filter(m => m.ordenes > 0)

        console.log('Mecánicos encontrados:', resultado.mecanicos.length)
      } catch (error) {
        console.error('Error en mecánicos:', error)
        resultado.mecanicos = []
      }
    }

    // CONTABILIDAD (SOLO ADMINS)
    if (incluirContabilidad && canViewContabilidad) {
      try {
        const ordenes = await prisma.ordenServicio.findMany({
          where: {
            estado: 'COMPLETADO',
            fechaCreacion: {
              gte: fechaInicioDate,
              lte: fechaFinDate
            }
          },
          select: {
            total: true,
            utilidad: true
          }
        })

        const egresos = await prisma.movimientoContable.findMany({
          where: {
            tipo: 'EGRESO',
            entidad: 'WAYRA',
            fecha: {
              gte: fechaInicioDate,
              lte: fechaFinDate
            }
          }
        })

        const totalIngresos = ordenes.reduce((sum, o) => sum + o.total, 0)
        const totalEgresos = egresos.reduce((sum, e) => sum + e.monto, 0)
        const totalUtilidad = ordenes.reduce((sum, o) => sum + o.utilidad, 0)

        resultado.contabilidad = {
          ingresos: totalIngresos,
          egresos: totalEgresos,
          utilidad: totalUtilidad
        }

        console.log('Contabilidad:', resultado.contabilidad)
      } catch (error) {
        console.error('Error en contabilidad:', error)
        resultado.contabilidad = {
          ingresos: 0,
          egresos: 0,
          utilidad: 0
        }
      }
    }

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('Error en reporte personalizado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}