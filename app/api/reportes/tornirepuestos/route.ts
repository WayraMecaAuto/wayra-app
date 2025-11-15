import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const periodo = searchParams.get('periodo')
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
    const trimestre = searchParams.get('trimestre') ? parseInt(searchParams.get('trimestre')!) : null
    const semestre = searchParams.get('semestre') ? parseInt(searchParams.get('semestre')!) : null

    // PRODUCTOS MÁS VENDIDOS (TODO EL TIEMPO)
    if (tipo === 'productos-vendidos') {
      const productosVendidos = await prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          p.nombre,
          p.categoria,
          CAST(SUM(dic.cantidad) AS INTEGER) as cantidad_vendida,
          CAST(SUM(dic."subtotalVenta") AS DECIMAL(10,2)) as total_vendido,
          CAST(SUM(dic.utilidad) AS DECIMAL(10,2)) as utilidad_total
        FROM "detalles_ingreso_contable" dic
        INNER JOIN "productos" p ON dic."productoId" = p.id
        INNER JOIN "movimientos_contables" mc ON dic."movimientoContableId" = mc.id
        WHERE mc.entidad = 'TORNIREPUESTOS'
          AND mc.tipo = 'INGRESO'
          AND p.tipo IN ('TORNI_REPUESTO', 'TORNILLERIA')
          AND p."isActive" = true
        GROUP BY p.id, p.nombre, p.categoria
        ORDER BY cantidad_vendida DESC
      `

      console.log('✅ TorniRepuestos - Productos vendidos:', productosVendidos.length)

      const productosNoVendidos = await prisma.producto.findMany({
        where: {
          tipo: { in: ['TORNI_REPUESTO', 'TORNILLERIA'] },
          isActive: true,
          detallesContables: {
            none: {}
          }
        },
        select: {
          id: true,
          nombre: true,
          categoria: true,
          stock: true,
          precioVenta: true
        },
        orderBy: { stock: 'desc' },
        take: 20
      })

      console.log('✅ TorniRepuestos - Productos sin ventas:', productosNoVendidos.length)

      return NextResponse.json({
        masVendidos: productosVendidos,
        menosVendidos: productosNoVendidos
      })
    }

    // REPORTES CONTABLES POR PERIODO
    if (tipo === 'contabilidad') {
      const isAdmin = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')
      if (!isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      let whereClause: any = {
        entidad: 'TORNIREPUESTOS',
        anio: año
      }

      // Determinar rango de meses según el periodo
      let meses: number[] = []
      
      if (periodo === 'mensual' && mes) {
        meses = [mes]
        whereClause.mes = mes
      } else if (periodo === 'trimestral' && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1
        const mesFin = trimestre * 3
        meses = Array.from({ length: mesFin - mesInicio + 1 }, (_, i) => mesInicio + i)
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      } else if (periodo === 'semestral' && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7
        const mesFin = semestre === 1 ? 6 : 12
        meses = Array.from({ length: mesFin - mesInicio + 1 }, (_, i) => mesInicio + i)
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      } else {
        // Anual
        meses = Array.from({ length: 12 }, (_, i) => i + 1)
      }

      console.log('📅 Consultando contabilidad TorniRepuestos para:', whereClause)

      // OBTENER TODOS LOS MOVIMIENTOS CONTABLES
      const movimientos = await prisma.movimientoContable.findMany({
        where: whereClause,
        orderBy: { fecha: 'desc' }
      })

      console.log('✅ Movimientos contables TorniRepuestos:', movimientos.length)

      // SEPARAR INGRESOS Y EGRESOS
      const ingresos = movimientos.filter(m => m.tipo === 'INGRESO')
      const egresos = movimientos.filter(m => m.tipo === 'EGRESO')

      // CALCULAR TOTALES DIRECTAMENTE DE LOS MOVIMIENTOS
      const totalIngresos = ingresos.reduce((sum, m) => sum + Number(m.monto), 0)
      const totalEgresos = egresos.reduce((sum, m) => sum + Number(m.monto), 0)
      const utilidadBruta = totalIngresos - totalEgresos

      console.log('💰 Totales contables TorniRepuestos:', { 
        ingresos: totalIngresos, 
        egresos: totalEgresos, 
        utilidadBruta 
      })

      // AGRUPAR POR PERIODO
      const porPeriodo = meses.map(mesNum => {
        const movsMes = movimientos.filter(m => m.mes === mesNum)
        const ingresosMes = movsMes.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + Number(m.monto), 0)
        const egresosMes = movsMes.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + Number(m.monto), 0)
        const utilidadMes = ingresosMes - egresosMes
        
        return {
          periodo: new Date(2024, mesNum - 1).toLocaleString('es-CO', { month: 'short' }).replace('.', ''),
          ingresos: Math.round(ingresosMes),
          egresos: Math.round(egresosMes),
          utilidad: Math.round(utilidadMes)
        }
      })

      console.log('📊 Por periodo TorniRepuestos generado:', porPeriodo)

      return NextResponse.json({
        resumen: {
          totalIngresos: Math.round(totalIngresos),
          totalEgresos: Math.round(totalEgresos),
          utilidadBruta: Math.round(utilidadBruta),
          margenUtilidad: totalIngresos > 0 ? ((utilidadBruta / totalIngresos) * 100).toFixed(2) : '0'
        },
        porPeriodo,
        movimientos: {
          ingresos: ingresos.slice(0, 50),
          egresos: egresos.slice(0, 50)
        }
      })
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === 'comparativa') {
      const isAdmin = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')
      if (!isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const año2 = parseInt(searchParams.get('año2') || String(año - 1))

      const movimientos1 = await prisma.movimientoContable.findMany({
        where: { entidad: 'TORNIREPUESTOS', anio: año },
        include: {
          detalleIngresos: true
        }
      })

      const movimientos2 = await prisma.movimientoContable.findMany({
        where: { entidad: 'TORNIREPUESTOS', anio: año2 },
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
        : '0'
      
      const crecimientoUtilidad = datos2.utilidadTotal > 0
        ? ((datos1.utilidadTotal - datos2.utilidadTotal) / datos2.utilidadTotal * 100).toFixed(2)
        : '0'

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
    console.error('Error en reportes TorniRepuestos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}