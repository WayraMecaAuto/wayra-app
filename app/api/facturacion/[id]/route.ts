import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: {
          select: {
            nombre: true,
            numeroDocumento: true,
            email: true,
            telefono: true,
            direccion: true
          }
        },
        orden: {
          include: {
            vehiculo: {
              select: {
                placa: true,
                marca: true,
                modelo: true,
                anio: true
              }
            },
            servicios: true,
            detalles: {
              include: {
                producto: {
                  select: {
                    nombre: true,
                    codigo: true,
                    aplicaIva: true
                  }
                }
              }
            },
            repuestosExternos: true,
            mecanico: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error fetching factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verificar que la factura existe
    const facturaExistente = await prisma.factura.findUnique({
      where: { id }
    })

    if (!facturaExistente) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // No permitir modificar facturas pagadas o anuladas
    if (facturaExistente.estado === 'PAGADA' || facturaExistente.estado === 'ANULADA') {
      return NextResponse.json({ 
        error: 'No se puede modificar una factura pagada o anulada' 
      }, { status: 400 })
    }

    const factura = await prisma.factura.update({
      where: { id },
      data: body,
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
          include: {
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

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error updating factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la factura existe
    const facturaExistente = await prisma.factura.findUnique({
      where: { id }
    })

    if (!facturaExistente) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // No permitir eliminar facturas pagadas
    if (facturaExistente.estado === 'PAGADA') {
      return NextResponse.json({ 
        error: 'No se puede eliminar una factura pagada. Debe anularla.' 
      }, { status: 400 })
    }

    await prisma.factura.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Factura eliminada exitosamente' })
  } catch (error) {
    console.error('Error deleting factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}