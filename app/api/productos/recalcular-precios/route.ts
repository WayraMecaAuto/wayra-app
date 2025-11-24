import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { calculatePrices } from '@/lib/pricing'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar permisos
    const canEdit = [
      'SUPER_USUARIO',
      'ADMIN_WAYRA_PRODUCTOS', 
      'ADMIN_TORNI_REPUESTOS'
    ].includes(session?.user?.role || '')
    
    if (!session || !canEdit) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { tipo, categoria } = await request.json()

    // Obtener tasa de cambio actual
    const tasaConfig = await prisma.configuracion.findUnique({
      where: { clave: 'TASA_USD_COP' }
    })
    const tasaUSD = parseFloat(tasaConfig?.valor || '4000')

    // Construir filtro
    let where: any = { isActive: true }
    if (tipo) where.tipo = tipo
    if (categoria) where.categoria = categoria

    // Obtener productos a actualizar
    const productos = await prisma.producto.findMany({ where })

    let actualizados = 0
    const errores: string[] = []

    // Actualizar cada producto
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

        actualizados++
      } catch (error) {
        errores.push(`Error actualizando ${producto.nombre}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      actualizados,
      total: productos.length,
      errores: errores.length > 0 ? errores : undefined
    })

  } catch (error) {
    console.error('Error recalculando precios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}