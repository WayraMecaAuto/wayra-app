import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'ventas' | 'contabilidad' | 'comparativa'
    const periodo = searchParams.get('periodo') // 'mensual' | 'trimestral' | 'semestral' | 'anual'
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null

    // PRODUCTOS MÁS VENDIDOS (TODO EL TIEMPO)
    if (tipo === 'productos-vendidos') {
      const productosVendidos = await prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          p.nombre,
          p.tipo,
          SUM(dic.cantidad) as cantidad_vendida,
          SUM(dic.subtotalVenta) as total_vendido,
          SUM(dic.utilidad) as utilidad_total
        FROM "detalles_ingreso_contable" dic
        INNER JOIN "productos" p ON dic."productoId" = p.id
        INNER JOIN "movimientos_contables" mc ON dic."movimientoContableId" = mc.id
        WHERE mc.entidad = 'WAYRA_PRODUCTOS'
          AND mc.tipo = 'INGRESO'
          AND p.tipo IN ('WAYRA_ENI', 'WAYRA_CALAN')
        GROUP BY p.id, p.nombre, p.tipo
        ORDER BY cantidad_vendida DESC
        LIMIT 20
      `

      const productosNoVendidos = await prisma.producto.findMany({
        where: {
          tipo: { in: ['WAYRA_ENI', 'WAYRA_CALAN'] },
          isActive: true,
          detallesContables: {
            none: {}
          }
        },
        select: {
          id: true,
          nombre: true,
          tipo: true,
          stock: true,
          precioVenta: true
        },
        take: 20
      })

      return NextResponse.json({
        masVendidos: productosVendidos,
        menosVendidos: productosNoVendidos
      })
    }

    // REPORTES CONTABLES POR PERIODO
    if (tipo === 'contabilidad') {
      let whereClause: any = {
        entidad: 'WAYRA_PRODUCTOS',
        anio: año
      }

      // Filtrar por periodo
      if (periodo === 'mensual' && mes) {
        whereClause.mes = mes
      } else if (periodo === 'trimestral' && mes) {
        const trimestre = Math.ceil(mes / 3)
        const mesInicio = (trimestre - 1) * 3 + 1
        const mesFin = trimestre * 3
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      } else if (periodo === 'semestral' && mes) {
        const semestre = mes <= 6 ? 1 : 2
        const mesInicio = semestre === 1 ? 1 : 7
        const mesFin = semestre === 1 ? 6 : 12
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      }

      const movimientos = await prisma.movimientoContable.findMany({
        where: whereClause,
        include: {
          detalleIngresos: {
            include: {
              producto: {
                select: { nombre: true, tipo: true }
              }
            }
          }
        },
        orderBy: { fecha: 'desc' }
      })

      const ingresos = movimientos.filter(m => m.tipo === 'INGRESO')
      const egresos = movimientos.filter(m => m.tipo === 'EGRESO')

      const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0)
      const totalEgresos = egresos.reduce((sum, m) => sum + m.monto, 0)
      const utilidadTotal = ingresos.reduce((sum, m) => {
        const utilidadMov = m.detalleIngresos.reduce((s, d) => s + d.utilidad, 0)
        return sum + utilidadMov
      }, 0)

      // Agrupar por mes para gráficos
      const porMes = Array.from({ length: 12 }, (_, i) => {
        const mesNum = i + 1
        const movsMes = movimientos.filter(m => m.mes === mesNum)
        const ingresosMes = movsMes.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + m.monto, 0)
        const egresosMes = movsMes.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + m.monto, 0)
        
        return {
          mes: new Date(2024, mesNum - 1).toLocaleString('es-CO', { month: 'short' }),
          ingresos: ingresosMes,
          egresos: egresosMes,
          utilidad: ingresosMes - egresosMes
        }
      })

      return NextResponse.json({
        resumen: {
          totalIngresos,
          totalEgresos,
          utilidad: totalIngresos - totalEgresos,
          utilidadNeta: utilidadTotal,
          margenUtilidad: totalIngresos > 0 ? (utilidadTotal / totalIngresos * 100).toFixed(2) : 0
        },
        porMes,
        movimientos: {
          ingresos: ingresos.slice(0, 50),
          egresos: egresos.slice(0, 50)
        }
      })
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === 'comparativa') {
      const año2 = parseInt(searchParams.get('año2') || String(año - 1))

      const movimientos1 = await prisma.movimientoContable.findMany({
        where: { entidad: 'WAYRA_PRODUCTOS', anio: año },
        include: {
          detalleIngresos: true
        }
      })

      const movimientos2 = await prisma.movimientoContable.findMany({
        where: { entidad: 'WAYRA_PRODUCTOS', anio: año2 },
        include: {
          detalleIngresos: true
        }
      })

      const procesarDatos = (movs: any[]) => {
        const porMes = Array.from({ length: 12 }, (_, i) => {
          const mesNum = i + 1
          const movsMes = movs.filter(m => m.mes === mesNum)
          const ingresos = movsMes.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + m.monto, 0)
          const egresos = movsMes.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + m.monto, 0)
          const utilidad = movsMes.filter(m => m.tipo === 'INGRESO').reduce((s, m) => {
            return s + m.detalleIngresos.reduce((sum: number, d: any) => sum + d.utilidad, 0)
          }, 0)
          
          return { mes: mesNum, ingresos, egresos, utilidad }
        })

        return {
          totalIngresos: porMes.reduce((s, m) => s + m.ingresos, 0),
          totalEgresos: porMes.reduce((s, m) => s + m.egresos, 0),
          utilidadTotal: porMes.reduce((s, m) => s + m.utilidad, 0),
          porMes
        }
      }

      const datos1 = procesarDatos(movimientos1)
      const datos2 = procesarDatos(movimientos2)

      // Calcular crecimiento
      const crecimientoIngresos = datos2.totalIngresos > 0 
        ? ((datos1.totalIngresos - datos2.totalIngresos) / datos2.totalIngresos * 100).toFixed(2)
        : 0
      
      const crecimientoUtilidad = datos2.utilidadTotal > 0
        ? ((datos1.utilidadTotal - datos2.utilidadTotal) / datos2.utilidadTotal * 100).toFixed(2)
        : 0

      return NextResponse.json({
        año1: { año, ...datos1 },
        año2: { año: año2, ...datos2 },
        crecimiento: {
          ingresos: crecimientoIngresos,
          utilidad: crecimientoUtilidad
        }
      })
    }

    return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })

  } catch (error) {
    console.error('Error en reportes Wayra Productos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}