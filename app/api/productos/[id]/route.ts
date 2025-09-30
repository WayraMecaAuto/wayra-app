import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { calculatePrices } from '@/lib/pricing'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Crear objeto de actualización limpio
    const updateData: any = {}

    // Solo incluir campos que existen en el modelo
    if (body.codigo) updateData.codigo = body.codigo
    if (body.codigoBarras) updateData.codigoBarras = body.codigoBarras
    if (body.nombre) updateData.nombre = body.nombre
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
    if (body.monedaCompra) updateData.monedaCompra = body.monedaCompra
    if (body.aplicaIva !== undefined) updateData.aplicaIva = body.aplicaIva

    // Convertir strings a números donde sea necesario
    if (body.precioCompra) {
      updateData.precioCompra = parseFloat(body.precioCompra.toString())
    }
    if (body.stockMinimo) {
      updateData.stockMinimo = parseInt(body.stockMinimo.toString())
    }
    if (body.porcentajeGanancia) {
      updateData.porcentajeGanancia = parseFloat(body.porcentajeGanancia.toString())
    }

    // Si se actualiza el precio de compra, recalcular precios
    if (updateData.precioCompra) {
      const producto = await prisma.producto.findUnique({
        where: { id }
      })

      if (producto) {
        const tasaConfig = await prisma.configuracion.findUnique({
          where: { clave: 'TASA_USD_COP' }
        })
        const tasaUSD = parseFloat(tasaConfig?.valor || '4000')

        const precios = calculatePrices(
          updateData.precioCompra,
          producto.tipo,
          producto.categoria,
          updateData.aplicaIva ?? producto.aplicaIva,
          tasaUSD
        )

        updateData.precioVenta = precios.precioVenta
        updateData.precioMinorista = precios.precioMinorista
        updateData.precioMayorista = precios.precioMayorista
      }
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error updating producto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // marcar como inactivo
    await prisma.producto.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting producto:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}