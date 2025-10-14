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
    const estado = searchParams.get('estado')

    let where: any = {}

    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        cliente: {
          select: { 
            nombre: true, 
            numeroDocumento: true,
            email: true,
            telefono: true
          }
        },
        orden: {
          select: {
            numeroOrden: true,
            vehiculo: {
              select: {
                placa: true
              }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    return NextResponse.json(facturas)
  } catch (error) {
    console.error('Error fetching facturas:', error)
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
    console.log('📝 Datos recibidos en API:', body)

    const { ordenId, clienteId, subtotal, iva, total, observaciones, vencimiento } = body

    // Validaciones detalladas
    if (!ordenId) {
      console.error('❌ Falta ordenId')
      return NextResponse.json({ 
        error: 'ordenId es requerido',
        received: body
      }, { status: 400 })
    }

    if (!clienteId) {
      console.error('❌ Falta clienteId')
      return NextResponse.json({ 
        error: 'clienteId es requerido',
        received: body
      }, { status: 400 })
    }

    console.log('✅ Validaciones pasadas')

    // Verificar que la orden existe y obtener cliente
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId },
      include: {
        cliente: {
          select: { id: true, nombre: true }
        }
      }
    })

    if (!orden) {
      console.error('❌ Orden no encontrada:', ordenId)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    console.log('✅ Orden encontrada:', orden.numeroOrden)
    console.log('✅ Cliente de la orden:', orden.cliente)

    // Usar clienteId de la orden si no viene en el body
    const clienteIdFinal = clienteId || orden.cliente.id

    console.log('✅ Cliente final:', clienteIdFinal)

    // Verificar que la orden no tenga ya una factura
    const facturaExistente = await prisma.factura.findFirst({
      where: { ordenId }
    })

    if (facturaExistente) {
      console.error('❌ Orden ya tiene factura:', facturaExistente.numeroFactura)
      return NextResponse.json({ error: 'Esta orden ya tiene una factura generada' }, { status: 400 })
    }

    console.log('✅ Orden no tiene factura previa')

    // Generar número de factura
    const lastFactura = await prisma.factura.findFirst({
      orderBy: { fecha: 'desc' }
    })

    const facturaNumber = lastFactura 
      ? parseInt(lastFactura.numeroFactura.split('-')[1]) + 1
      : 1

    const numeroFactura = `FAC-${facturaNumber.toString().padStart(6, '0')}`

    console.log('📄 Número de factura generado:', numeroFactura)

    // Crear factura
    const factura = await prisma.factura.create({
      data: {
        numeroFactura,
        clienteId: clienteIdFinal,
        ordenId,
        subtotal: Number(subtotal),
        iva: Number(iva),
        total: Number(total),
        observaciones: observaciones || null,
        vencimiento: vencimiento ? new Date(vencimiento) : null,
        estado: 'PENDIENTE'
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            numeroDocumento: true,
            email: true,
            telefono: true
          }
        },
        orden: {
          select: {
            numeroOrden: true,
            vehiculo: {
              select: {
                placa: true,
                marca: true,
                modelo: true
              }
            }
          }
        }
      }
    })

    console.log('✅ Factura creada exitosamente:', factura.numeroFactura)

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating factura:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}