import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { calculatePrices } from '@/lib/pricing'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    const canView = [
      'SUPER_USUARIO',
      'ADMIN_WAYRA_PRODUCTOS',
      'ADMIN_TORNI_REPUESTOS'
    ].includes(session?.user?.role || '')
    
    if (!session || !canView) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const configuraciones = await prisma.configuracion.findMany({
      orderBy: { clave: 'asc' }
    })

    return NextResponse.json(configuraciones)
  } catch (error) {
    console.error('Error fetching configuraciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const canEdit = [
      'SUPER_USUARIO',
      'ADMIN_WAYRA_PRODUCTOS',
      'ADMIN_TORNI_REPUESTOS'
    ].includes(session?.user?.role || '')
    
    if (!session || !canEdit) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { clave, valor } = await request.json()

    if (!clave || valor === undefined) {
      return NextResponse.json({ error: 'Clave y valor son requeridos' }, { status: 400 })
    }

    // Actualizar configuración
    const configuracion = await prisma.configuracion.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor, descripcion: '' }
    })

    // Actualizar configuraciones en memoria
    const { updatePricingConfigFromDB } = await import('@/lib/pricing')
    await updatePricingConfigFromDB()

    // Determinar qué productos recalcular según la clave modificada
    let productosAfectados: string[] = []
    let shouldRecalculate = false

    // Mapeo de claves de configuración a tipos/categorías de productos
    const recalculationMap: Record<string, { tipo?: string, categoria?: string }> = {
      'WAYRA_MARGEN_ENI': { tipo: 'WAYRA_ENI' },
      'WAYRA_MARGEN_CALAN': { tipo: 'WAYRA_CALAN' },
      'WAYRA_DESCUENTO_MINORISTA': { tipo: 'WAYRA_ENI,WAYRA_CALAN' },
      'WAYRA_DESCUENTO_MAYORISTA': { tipo: 'WAYRA_ENI,WAYRA_CALAN' },
      'TASA_USD_COP': { tipo: 'WAYRA_CALAN' },
      'IVA_CALAN': { tipo: 'WAYRA_CALAN' },
      'TORNI_MARGEN_REPUESTOS': { tipo: 'TORNI_REPUESTO', categoria: 'REPUESTOS' },
      'TORNI_MARGEN_FILTROS': { tipo: 'TORNI_REPUESTO', categoria: 'FILTROS' },
      'TORNI_MARGEN_LUBRICANTES': { tipo: 'TORNI_REPUESTO', categoria: 'LUBRICANTES' },
      'TORNI_DESCUENTO_MINORISTA': { tipo: 'TORNI_REPUESTO' },
      'TORNI_DESCUENTO_MAYORISTA': { tipo: 'TORNI_REPUESTO' },
      'TORNILLERIA_MARGEN': { tipo: 'TORNILLERIA' }
    }

    if (recalculationMap[clave]) {
      shouldRecalculate = true
      const filter = recalculationMap[clave]
      
      // Obtener tasa actual
      const tasaConfig = await prisma.configuracion.findUnique({
        where: { clave: 'TASA_USD_COP' }
      })
      const tasaUSD = parseFloat(tasaConfig?.valor || '4000')

      // Construir filtro de productos
      let where: any = { isActive: true }
      
      if (filter.tipo) {
        const tipos = filter.tipo.split(',')
        if (tipos.length > 1) {
          where.tipo = { in: tipos }
        } else {
          where.tipo = tipos[0]
        }
      }
      
      if (filter.categoria) {
        where.categoria = filter.categoria
      }

      // Recalcular precios
      const productos = await prisma.producto.findMany({ where })
      
      for (const producto of productos) {
        try {
          const precios = calculatePrices(
            producto.precioCompra,
            producto.tipo,
            producto.categoria,
            producto.aplicaIva,
            tasaUSD
          )

          await prisma.producto.update({
            where: { id: producto.id },
            data: {
              precioVenta: precios.precioVenta,
              precioMinorista: precios.precioMinorista,
              precioMayorista: precios.precioMayorista,
              porcentajeGanancia: precios.config.margenGanancia
            }
          })

          productosAfectados.push(producto.id)
        } catch (error) {
          console.error(`Error actualizando producto ${producto.nombre}:`, error)
        }
      }
    }

    // Incluir información de timestamp para que los clientes sepan cuándo actualizar
    const response = {
      configuracion,
      productosActualizados: productosAfectados.length,
      recalculado: shouldRecalculate,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating configuracion:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}