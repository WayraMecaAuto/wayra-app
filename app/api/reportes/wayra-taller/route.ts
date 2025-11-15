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
    const tipo = searchParams.get('tipo')
    const periodo = searchParams.get('periodo')
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))
    const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
    const trimestre = searchParams.get('trimestre') ? parseInt(searchParams.get('trimestre')!) : null
    const semestre = searchParams.get('semestre') ? parseInt(searchParams.get('semestre')!) : null

    // Verificar permisos para contabilidad
    const canViewContabilidad = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

    // SERVICIOS MÁS/MENOS REALIZADOS
    if (tipo === 'servicios-frecuencia') {
      const filtrarPorMes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
      const filtrarPorAño = searchParams.get('año') ? parseInt(searchParams.get('año')!) : null

      let queryCondition = ''
      if (filtrarPorMes && filtrarPorAño) {
        queryCondition = `AND os.mes = ${filtrarPorMes} AND os.anio = ${filtrarPorAño}`
      }

      const servicios = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          so.descripcion,
          COUNT(*) as veces_realizado,
          SUM(so.precio) as ingreso_total,
          AVG(so.precio) as precio_promedio
        FROM "servicios_orden" so
        INNER JOIN "ordenes_servicio" os ON so."ordenId" = os.id
        WHERE os.estado = 'COMPLETADO' ${queryCondition}
        GROUP BY so.descripcion
        ORDER BY veces_realizado DESC
      `)

      // Normalizar descripciones de lubricación
      const serviciosAgrupados = servicios.reduce((acc: any[], serv: any) => {
        let descripcion = serv.descripcion.trim()
        if (descripcion.toLowerCase().includes('lubricación') || descripcion.toLowerCase().includes('lubricacion')) {
          descripcion = 'Lubricación'
        }
        
        const existente = acc.find(s => s.descripcion === descripcion)
        if (existente) {
          existente.veces_realizado += parseInt(serv.veces_realizado)
          existente.ingreso_total += parseFloat(serv.ingreso_total)
        } else {
          acc.push({
            descripcion,
            veces_realizado: parseInt(serv.veces_realizado),
            ingreso_total: parseFloat(serv.ingreso_total),
            precio_promedio: parseFloat(serv.precio_promedio)
          })
        }
        return acc
      }, [])

      serviciosAgrupados.sort((a, b) => b.veces_realizado - a.veces_realizado)

      return NextResponse.json({
        masRealizados: serviciosAgrupados,
        menosRealizados: serviciosAgrupados.slice(-10).reverse()
      })
    }

    // PRODUCTIVIDAD POR MECÁNICO
    if (tipo === 'mecanicos-productividad') {
      let whereClause: any = {
        estado: 'COMPLETADO',
        anio: año
      }

      // Filtrar por periodo
      if (periodo === 'mensual' && mes) {
        whereClause.mes = mes
      } else if (periodo === 'trimestral' && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1
        const mesFin = trimestre * 3
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      } else if (periodo === 'semestral' && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7
        const mesFin = semestre === 1 ? 6 : 12
        whereClause.mes = { gte: mesInicio, lte: mesFin }
      }

      const mecanicos = await prisma.user.findMany({
        where: { role: 'MECANICO', isActive: true },
        select: { id: true, name: true }
      })

      const productividad = await Promise.all(
        mecanicos.map(async (mecanico) => {
          const ordenes = await prisma.ordenServicio.findMany({
            where: {
              ...whereClause,
              mecanicoId: mecanico.id
            },
            include: {
              servicios: true
            }
          })

          const totalOrdenes = ordenes.length
          const totalIngresos = ordenes.reduce((sum, o) => sum + o.total, 0)
          const utilidadTotal = ordenes.reduce((sum, o) => sum + o.utilidad, 0)

          // Calcular tiempo promedio
          const ordenesConTiempo = ordenes.filter(o => o.fechaInicio && o.fechaFin)
          const tiempoPromedio = ordenesConTiempo.length > 0
            ? ordenesConTiempo.reduce((sum, o) => {
                const inicio = new Date(o.fechaInicio!).getTime()
                const fin = new Date(o.fechaFin!).getTime()
                return sum + (fin - inicio) / (1000 * 60 * 60) // Horas
              }, 0) / ordenesConTiempo.length
            : 0

          return {
            mecanico: mecanico.name,
            mecanicoId: mecanico.id,
            totalOrdenes,
            totalIngresos,
            utilidadTotal,
            tiempoPromedioHoras: tiempoPromedio.toFixed(2),
            ingresoPromedioPorOrden: totalOrdenes > 0 ? (totalIngresos / totalOrdenes).toFixed(2) : '0'
          }
        })
      )

      // Ordenar por total de órdenes
      productividad.sort((a, b) => b.totalOrdenes - a.totalOrdenes)

      return NextResponse.json({
        productividad,
        mecanicoDelMes: productividad[0] || null
      })
    }

    // REPORTES CONTABLES (SOLO ADMINS)
    if (tipo === 'contabilidad') {
      if (!canViewContabilidad) {
        return NextResponse.json({ error: 'Sin permisos para ver contabilidad' }, { status: 403 })
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

      console.log('📅 Consultando contabilidad Wayra Taller para:', whereClause)

      // OBTENER INGRESOS (de órdenes completadas)
      const ordenes = await prisma.ordenServicio.findMany({
        where: whereClause
      })

      // OBTENER EGRESOS (de movimientos contables)
      let egresosWhere: any = {
        tipo: 'EGRESO',
        entidad: 'WAYRA',
        anio: año
      }

      if (periodo === 'mensual' && mes) {
        egresosWhere.mes = mes
      } else if (periodo === 'trimestral' && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1
        const mesFin = trimestre * 3
        egresosWhere.mes = { gte: mesInicio, lte: mesFin }
      } else if (periodo === 'semestral' && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7
        const mesFin = semestre === 1 ? 6 : 12
        egresosWhere.mes = { gte: mesInicio, lte: mesFin }
      }

      const egresos = await prisma.movimientoContable.findMany({
        where: egresosWhere
      })

      console.log('✅ Órdenes encontradas:', ordenes.length, '| Egresos:', egresos.length)

      // CALCULAR TOTALES DIRECTAMENTE
      const totalIngresos = ordenes.reduce((sum, o) => sum + Number(o.total), 0)
      const totalEgresos = egresos.reduce((sum, e) => sum + Number(e.monto), 0)
      const utilidadBruta = totalIngresos - totalEgresos

      console.log('💰 Totales contables Taller:', { 
        ingresos: totalIngresos, 
        egresos: totalEgresos, 
        utilidadBruta 
      })

      // AGRUPAR POR PERIODO
      const porPeriodo = meses.map(mesNum => {
        const ordenesDelMes = ordenes.filter(o => o.mes === mesNum)
        const egresosDelMes = egresos.filter(e => e.mes === mesNum)
        
        const ingresosDelMes = ordenesDelMes.reduce((s, o) => s + Number(o.total), 0)
        const egresosDelMes_total = egresosDelMes.reduce((s, e) => s + Number(e.monto), 0)
        const utilidadMes = ingresosDelMes - egresosDelMes_total

        return {
          periodo: new Date(2024, mesNum - 1).toLocaleString('es-CO', { month: 'short' }).replace('.', ''),
          ingresos: Math.round(ingresosDelMes),
          egresos: Math.round(egresosDelMes_total),
          utilidad: Math.round(utilidadMes),
          ordenes: ordenesDelMes.length
        }
      })

      console.log('📊 Por periodo generado:', porPeriodo)

      return NextResponse.json({
        resumen: {
          totalIngresos: Math.round(totalIngresos),
          totalEgresos: Math.round(totalEgresos),
          utilidadNeta: Math.round(utilidadTotal),
          margenUtilidad: totalIngresos > 0 ? ((utilidadTotal / totalIngresos) * 100).toFixed(2) : '0',
          totalOrdenes: ordenes.length
        },
        porPeriodo: porPeriodo.map(p => ({
          ...p,
          ingresos: Math.round(p.ingresos),
          egresos: Math.round(p.egresos),
          utilidad: Math.round(p.utilidad)
        })),
        egresos: egresos.slice(0, 50)
      })
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === 'comparativa') {
      if (!canViewContabilidad) {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }

      const año2 = parseInt(searchParams.get('año2') || String(año - 1))

      const ordenes1 = await prisma.ordenServicio.findMany({
        where: { estado: 'COMPLETADO', anio: año }
      })

      const ordenes2 = await prisma.ordenServicio.findMany({
        where: { estado: 'COMPLETADO', anio: año2 }
      })

      const egresos1 = await prisma.movimientoContable.findMany({
        where: { tipo: 'EGRESO', entidad: 'WAYRA', anio: año }
      })

      const egresos2 = await prisma.movimientoContable.findMany({
        where: { tipo: 'EGRESO', entidad: 'WAYRA', anio: año2 }
      })

      const procesarDatos = (ordenes: any[], egresos: any[]) => {
        const porMes = Array.from({ length: 12 }, (_, i) => {
          const mesNum = i + 1
          const ordenesDelMes = ordenes.filter(o => o.mes === mesNum)
          const egresosDelMes = egresos.filter(e => e.mes === mesNum)
          
          return {
            mes: mesNum,
            ingresos: ordenesDelMes.reduce((s, o) => s + o.total, 0),
            egresos: egresosDelMes.reduce((s, e) => s + e.monto, 0),
            utilidad: ordenesDelMes.reduce((s, o) => s + o.utilidad, 0),
            ordenes: ordenesDelMes.length
          }
        })

        return {
          totalIngresos: porMes.reduce((s, m) => s + m.ingresos, 0),
          totalEgresos: porMes.reduce((s, m) => s + m.egresos, 0),
          utilidadTotal: porMes.reduce((s, m) => s + m.utilidad, 0),
          totalOrdenes: porMes.reduce((s, m) => s + m.ordenes, 0),
          porMes
        }
      }

      const datos1 = procesarDatos(ordenes1, egresos1)
      const datos2 = procesarDatos(ordenes2, egresos2)

      const crecimientoIngresos = datos2.totalIngresos > 0 
        ? ((datos1.totalIngresos - datos2.totalIngresos) / datos2.totalIngresos * 100).toFixed(2)
        : '0'
      
      const crecimientoOrdenes = datos2.totalOrdenes > 0
        ? ((datos1.totalOrdenes - datos2.totalOrdenes) / datos2.totalOrdenes * 100).toFixed(2)
        : '0'

      return NextResponse.json({
        año1: { año, ...datos1 },
        año2: { año: año2, ...datos2 },
        crecimiento: {
          ingresos: crecimientoIngresos,
          ordenes: crecimientoOrdenes
        }
      })
    }

    return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })

  } catch (error) {
    console.error('Error en reportes Wayra Taller:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}