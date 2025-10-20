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
    const mes = parseInt(searchParams.get('mes') || '1')
    const año = parseInt(searchParams.get('año') || '2024')

    // Obtener ingresos
    const ingresosMovimientos = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'INGRESO',
        concepto: { in: ['VENTA_PRODUCTO', 'VENTA_DESDE_ORDEN'] },
        entidad: 'WAYRA_PRODUCTOS',
        mes,
        anio: año
      },
      include: {
        detalleIngresos: {
          include: {
            producto: true
          }
        }
      }
    })

    const ingresos = ingresosMovimientos.flatMap(mov =>
      mov.detalleIngresos.map(detalle => ({
        id: detalle.id,
        fecha: mov.fecha,
        cantidad: detalle.cantidad,
        descripcion: mov.descripcion,
        precioCompra: detalle.precioCompra,
        precioVenta: detalle.precioVenta,
        utilidad: detalle.utilidad,
        ordenId: mov.referencia,
        productoId: detalle.productoId,
        concepto: mov.concepto
      }))
    )

    // Obtener egresos
    const egresos = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'EGRESO',
        entidad: 'WAYRA_PRODUCTOS',
        mes,
        anio: año
      },
      include: {
        usuario: {
          select: { name: true }
        }
      }
    })

    const egresosFormato = egresos.map(e => ({
      id: e.id,
      fecha: e.fecha,
      descripcion: e.descripcion,
      concepto: e.concepto,
      usuario: e.usuario.name,
      valor: e.monto
    }))

    return NextResponse.json({
      ingresos,
      egresos: egresosFormato
    })
  } catch (error) {
    console.error('Error fetching contabilidad:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { descripcion, valor, concepto } = body

    if (!descripcion || !valor || !concepto) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const ahora = new Date()
    const mes = ahora.getMonth() + 1
    const anio = ahora.getFullYear()

    // Crear egreso
    const egreso = await prisma.movimientoContable.create({
      data: {
        tipo: 'EGRESO',
        concepto,
        monto: parseFloat(valor),
        descripcion,
        entidad: 'WAYRA_PRODUCTOS',
        mes,
        anio,
        usuarioId: session.user.id
      }
    })

    return NextResponse.json(egreso, { status: 201 })
  } catch (error) {
    console.error('Error creating egreso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}