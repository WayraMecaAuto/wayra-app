import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Función para obtener datos de contabilidad de un mes específico
async function obtenerContabilidadMes(mesNum: number, anioNum: number) {
  // Obtener ingresos de productos vendidos (órdenes y ventas directas)
  const ingresosMovimientos = await prisma.movimientoContable.findMany({
    where: {
      tipo: 'INGRESO',
      concepto: { in: ['VENTA_PRODUCTO', 'VENTA_DESDE_ORDEN'] },
      entidad: 'WAYRA_PRODUCTOS',
      mes: mesNum,
      anio: anioNum
    },
    include: {
      detalleIngresos: {
        include: {
          producto: {
            select: {
              nombre: true,
              codigo: true,
              tipo: true
            }
          }
        }
      }
    },
    orderBy: { fecha: 'desc' }
  })

  const ingresos = ingresosMovimientos.flatMap(mov =>
    mov.detalleIngresos.map(detalle => ({
      id: detalle.id,
      fecha: mov.fecha,
      cantidad: detalle.cantidad,
      descripcion: detalle.producto.nombre,
      tipo: detalle.producto.tipo,
      precioCompra: Number(detalle.precioCompra),
      precioVenta: Number(detalle.precioVenta),
      utilidad: Number(detalle.utilidad),
      ordenId: mov.referencia?.startsWith('ORD-') ? mov.referencia : null,
      productoId: detalle.productoId,
      motivo: mov.descripcion,
      mes: mesNum
    }))
  )

  // Obtener egresos
  const egresosData = await prisma.movimientoContable.findMany({
    where: {
      tipo: 'EGRESO',
      entidad: 'WAYRA_PRODUCTOS',
      mes: mesNum,
      anio: anioNum
    },
    include: {
      usuario: {
        select: { name: true }
      }
    },
    orderBy: { fecha: 'desc' }
  })

  const egresos = egresosData.map(e => ({
    id: e.id,
    fecha: e.fecha,
    descripcion: e.descripcion,
    concepto: e.concepto,
    usuario: e.usuario.name,
    valor: Number(e.monto),
    mes: mesNum
  }))

  return { ingresos, egresos }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR_WAYRA'].includes(session?.user?.role || '')
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

    console.log('📊 API Wayra Productos - Parámetros:', { tipo, periodo, año, mes, trimestre, semestre })

    // PRODUCTOS MÁS VENDIDOS
    if (tipo === 'productos-vendidos') {
      const mesFilter = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : null
      const añoFilter = searchParams.get('año') ? parseInt(searchParams.get('año')!) : null

      let whereCondition = ''
      if (mesFilter && añoFilter) {
        whereCondition = `AND mc.mes = ${mesFilter} AND mc.anio = ${añoFilter}`
      }

      console.log('🔍 Filtrando productos Wayra:', { mesFilter, añoFilter })

      const productosVendidos = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          p.id,
          p.nombre,
          p.tipo,
          CAST(SUM(dic.cantidad) AS INTEGER) as cantidad_vendida,
          CAST(SUM(dic."subtotalVenta") AS DECIMAL(10,2)) as total_vendido,
          CAST(SUM(dic.utilidad) AS DECIMAL(10,2)) as utilidad_total
        FROM "detalles_ingreso_contable" dic
        INNER JOIN "productos" p ON dic."productoId" = p.id
        INNER JOIN "movimientos_contables" mc ON dic."movimientoContableId" = mc.id
        WHERE mc.entidad = 'WAYRA_PRODUCTOS'
          AND mc.tipo = 'INGRESO'
          AND p.tipo IN ('WAYRA_ENI', 'WAYRA_CALAN')
          AND p."isActive" = true
          ${whereCondition}
        GROUP BY p.id, p.nombre, p.tipo
        ORDER BY cantidad_vendida DESC
      `)

      console.log('✅ Wayra - Productos vendidos:', productosVendidos.length)

      const productosNoVendidos = await prisma.producto.findMany({
        where: {
          tipo: { in: ['WAYRA_ENI', 'WAYRA_CALAN'] },
          isActive: true,
          detallesContables: { none: {} }
        },
        select: {
          id: true,
          nombre: true,
          tipo: true,
          stock: true,
          precioVenta: true
        },
        orderBy: { stock: 'desc' },
        take: 20
      })

      console.log('✅ Wayra - Productos sin ventas:', productosNoVendidos.length)

      return NextResponse.json({
        masVendidos: productosVendidos,
        menosVendidos: productosNoVendidos
      })
    }

    // REPORTES CONTABLES - USANDO LA MISMA LÓGICA QUE /api/contabilidad/wayra-productos
    if (tipo === 'contabilidad') {
      const isAdmin = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')
      if (!isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      console.log('💰 Calculando contabilidad Wayra Productos...')

      // Determinar rango de meses
      let mesesRango: number[] = []
      
      if (periodo === 'mensual' && mes) {
        mesesRango = [mes]
      } else if (periodo === 'trimestral' && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1
        mesesRango = [mesInicio, mesInicio + 1, mesInicio + 2]
      } else if (periodo === 'semestral' && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7
        mesesRango = Array.from({ length: 6 }, (_, i) => mesInicio + i)
      } else {
        mesesRango = Array.from({ length: 12 }, (_, i) => i + 1)
      }

      console.log('📅 Meses a consultar:', mesesRango)

      // OBTENER DATOS DE CONTABILIDAD PARA CADA MES
      const todosIngresos: any[] = []
      const todosEgresos: any[] = []

      for (const mesNum of mesesRango) {
        const { ingresos, egresos } = await obtenerContabilidadMes(mesNum, año)
        todosIngresos.push(...ingresos)
        todosEgresos.push(...egresos)
      }

      console.log('✅ Total ingresos:', todosIngresos.length)
      console.log('✅ Total egresos:', todosEgresos.length)

      // CALCULAR TOTALES (EXACTAMENTE COMO EN LA PÁGINA DE CONTABILIDAD)
      const totalIngresos = todosIngresos.reduce((sum, i) => sum + (i.precioVenta * i.cantidad), 0)
      const totalCostos = todosIngresos.reduce((sum, i) => sum + (i.precioCompra * i.cantidad), 0)
      const totalEgresos = todosEgresos.reduce((sum, e) => sum + e.valor, 0)
      const totalUtilidad = totalIngresos - totalEgresos

      console.log('💰 Totales calculados:', {
        totalIngresos,
        totalCostos,
        totalEgresos,
        totalUtilidad
      })

      // GENERAR DATOS POR PERIODO
      let porPeriodo: any[] = []

      if (periodo === 'mensual' && mes) {
        // Día a día
        const diasEnMes = new Date(año, mes, 0).getDate()
        porPeriodo = Array.from({ length: diasEnMes }, (_, i) => {
          const dia = i + 1
          const ingresosDia = todosIngresos.filter(ing => new Date(ing.fecha).getDate() === dia)
          const egresosDia = todosEgresos.filter(egr => new Date(egr.fecha).getDate() === dia)

          const ingresosVal = ingresosDia.reduce((s, i) => s + (i.precioVenta * i.cantidad), 0)
          const costosVal = ingresosDia.reduce((s, i) => s + (i.precioCompra * i.cantidad), 0)
          const egresosVal = egresosDia.reduce((s, e) => s + e.valor, 0)

          return {
            periodo: `Día ${dia}`,
            ingresos: Math.round(ingresosVal),
            costos: Math.round(costosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal)
          }
        })
      } else {
        // Mes a mes
        porPeriodo = mesesRango.map(mesNum => {
          const ingresosMes = todosIngresos.filter(i => i.mes === mesNum)
          const egresosMes = todosEgresos.filter(e => e.mes === mesNum)

          const ingresosVal = ingresosMes.reduce((s, i) => s + (i.precioVenta * i.cantidad), 0)
          const costosVal = ingresosMes.reduce((s, i) => s + (i.precioCompra * i.cantidad), 0)
          const egresosVal = egresosMes.reduce((s, e) => s + e.valor, 0)

          return {
            periodo: new Date(año, mesNum - 1).toLocaleString('es-CO', { month: 'short' }).replace('.', ''),
            ingresos: Math.round(ingresosVal),
            costos: Math.round(costosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal)
          }
        })
      }

      console.log('📊 Datos por periodo generados:', porPeriodo.length, 'puntos')

      return NextResponse.json({
        resumen: {
          totalIngresos: Math.round(totalIngresos),
          totalCostos: Math.round(totalCostos),
          totalEgresos: Math.round(totalEgresos),
          utilidadBruta: Math.round(totalUtilidad),
          margenUtilidad: totalIngresos > 0 ? ((totalUtilidad / totalIngresos) * 100).toFixed(2) : '0'
        },
        porPeriodo,
        movimientos: {
          ingresos: todosIngresos.slice(0, 50),
          egresos: todosEgresos.slice(0, 50)
        }
      })
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === 'comparativa') {
      const isAdmin = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')
      if (!isAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const año2 = parseInt(searchParams.get('año2') || String(año - 1))

      console.log('📊 Comparando años:', año, 'vs', año2)

      const procesarDatosAnio = async (anioTarget: number) => {
        const todosIngresos: any[] = []
        const todosEgresos: any[] = []

        for (let mesNum = 1; mesNum <= 12; mesNum++) {
          const { ingresos, egresos } = await obtenerContabilidadMes(mesNum, anioTarget)
          todosIngresos.push(...ingresos)
          todosEgresos.push(...egresos)
        }

        const porMes = Array.from({ length: 12 }, (_, i) => {
          const mesNum = i + 1
          const ingresosMes = todosIngresos.filter(ing => ing.mes === mesNum)
          const egresosMes = todosEgresos.filter(egr => egr.mes === mesNum)

          const ingresosVal = ingresosMes.reduce((s, i) => s + (i.precioVenta * i.cantidad), 0)
          const costosVal = ingresosMes.reduce((s, i) => s + (i.precioCompra * i.cantidad), 0)
          const egresosVal = egresosMes.reduce((s, e) => s + e.valor, 0)
          const utilidad = ingresosVal - egresosVal

          return { mes: mesNum, ingresos: ingresosVal, costos: costosVal, egresos: egresosVal, utilidad }
        })

        return {
          totalIngresos: porMes.reduce((s, m) => s + m.ingresos, 0),
          totalCostos: porMes.reduce((s, m) => s + m.costos, 0),
          totalEgresos: porMes.reduce((s, m) => s + m.egresos, 0),
          utilidadTotal: porMes.reduce((s, m) => s + m.utilidad, 0),
          porMes
        }
      }

      const datos1 = await procesarDatosAnio(año)
      const datos2 = await procesarDatosAnio(año2)

      const crecimientoIngresos = datos2.totalIngresos > 0 
        ? ((datos1.totalIngresos - datos2.totalIngresos) / datos2.totalIngresos * 100).toFixed(2)
        : '0'
      
      const crecimientoUtilidad = datos2.utilidadTotal > 0
        ? ((datos1.utilidadTotal - datos2.utilidadTotal) / datos2.utilidadTotal * 100).toFixed(2)
        : '0'

      console.log('✅ Comparativa generada')

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
    console.error('❌ Error Wayra Productos Reportes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}