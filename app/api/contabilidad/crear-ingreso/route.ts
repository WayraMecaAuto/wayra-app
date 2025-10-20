import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productoId,
      cantidad,
      precioCompra,
      precioVenta,
      descripcion,
      entidad,
      esDesdeOrden = false,
      ordenId = null
    } = body

    if (!productoId || !cantidad || !precioCompra || !precioVenta || !entidad) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Crear movimiento contable
    const movimiento = await prisma.movimientoContable.create({
      data: {
        tipo: 'INGRESO',
        concepto: esDesdeOrden ? 'VENTA_DESDE_ORDEN' : 'VENTA_PRODUCTO',
        monto: precioVenta * cantidad,
        fecha: new Date(),
        descripcion: esDesdeOrden 
          ? `${descripcion} - Orden ${ordenId}`
          : descripcion,
        entidad,
        referencia: ordenId || productoId,
        usuarioId: session.user.id
      }
    })

    // Crear detalle del ingreso
    await prisma.detalleIngresoContable.create({
      data: {
        movimientoContableId: movimiento.id,
        productoId,
        cantidad,
        precioCompra,
        precioVenta,
        subtotalCompra: precioCompra * cantidad,
        subtotalVenta: precioVenta * cantidad,
        utilidad: (precioVenta - precioCompra) * cantidad
      }
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('Error creating ingreso contable:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}