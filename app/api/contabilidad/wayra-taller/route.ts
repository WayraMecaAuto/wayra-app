import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
    const año = parseInt(searchParams.get('año') || String(new Date().getFullYear()))

    // Obtener órdenes completadas del periodo
    const ordenesCompletadas = await prisma.ordenServicio.findMany({
      where: {
        estado: 'COMPLETADO',
        mes,
        anio: año
      },
      include: {
        servicios: true,
        repuestosExternos: true,
        cliente: {
          select: { nombre: true }
        },
        vehiculo: {
          select: { placa: true, marca: true, modelo: true }
        }
      },
      orderBy: { fechaFin: 'desc' }
    })

    // Procesar ingresos: SOLO servicios y repuestos externos
    const ingresos: any[] = []
    const serviciosPorDescripcion: { [key: string]: { cantidad: number, ingresoTotal: number } } = {}

    ordenesCompletadas.forEach(orden => {
      // SERVICIOS (siempre van a Wayra Taller)
      orden.servicios.forEach(servicio => {
        ingresos.push({
          id: servicio.id,
          fecha: orden.fechaFin || orden.fechaCreacion,
          descripcion: `${servicio.descripcion} - Orden ${orden.numeroOrden}`,
          monto: servicio.precio,
          tipo: 'SERVICIO',
          ordenId: orden.id
        })

        // Estadística de servicios más realizados
        if (!serviciosPorDescripcion[servicio.descripcion]) {
          serviciosPorDescripcion[servicio.descripcion] = {
            cantidad: 0,
            ingresoTotal: 0
          }
        }
        serviciosPorDescripcion[servicio.descripcion].cantidad++
        serviciosPorDescripcion[servicio.descripcion].ingresoTotal += servicio.precio
      })

      // REPUESTOS EXTERNOS (solo estos van a Wayra Taller)
      orden.repuestosExternos.forEach(repuesto => {
        ingresos.push({
          id: repuesto.id,
          fecha: orden.fechaFin || orden.fechaCreacion,
          descripcion: `${repuesto.nombre} - Orden ${orden.numeroOrden}`,
          monto: repuesto.subtotal,
          utilidad: repuesto.utilidad,
          tipo: 'REPUESTO_EXTERNO',
          ordenId: orden.id
        })
      })

      // MANO DE OBRA
      if (orden.manoDeObra && orden.manoDeObra > 0) {
        ingresos.push({
          id: `mo-${orden.id}`,
          fecha: orden.fechaFin || orden.fechaCreacion,
          descripcion: `Mano de obra - Orden ${orden.numeroOrden}`,
          monto: orden.manoDeObra,
          tipo: 'MANO_OBRA',
          ordenId: orden.id
        })
      }
    })

    // Servicios más realizados
    const serviciosMasRealizados = Object.entries(serviciosPorDescripcion)
      .map(([descripcion, data]) => ({
        descripcion,
        cantidad: data.cantidad,
        ingresoTotal: data.ingresoTotal
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10)

    // Obtener egresos (nóminas y gastos operacionales)
    const egresos = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'EGRESO',
        entidad: 'WAYRA',
        mes,
        anio: año
      },
      include: {
        usuario: {
          select: { 
            name: true,
            role: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    const egresosFormato = egresos.map(e => ({
      id: e.id,
      fecha: e.fecha,
      descripcion: e.descripcion,
      concepto: e.concepto,
      usuario: e.usuario.name,
      rol: e.usuario.role,
      valor: e.monto
    }))

    return NextResponse.json({
      ingresos,
      serviciosMasRealizados,
      egresos: egresosFormato
    })
  } catch (error) {
    console.error('Error fetching contabilidad wayra-taller:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
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
        entidad: 'WAYRA',
        mes,
        anio,
        usuarioId: session.user.id
      },
      include: {
        usuario: {
          select: {
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      id: egreso.id,
      fecha: egreso.fecha,
      descripcion: egreso.descripcion,
      concepto: egreso.concepto,
      usuario: egreso.usuario.name,
      rol: egreso.usuario.role,
      valor: egreso.monto
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating egreso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.movimientoContable.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Egreso eliminado' })
  } catch (error) {
    console.error('Error deleting egreso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}