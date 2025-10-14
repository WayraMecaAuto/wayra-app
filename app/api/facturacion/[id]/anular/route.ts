import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
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

    // Verificar que no esté ya anulada
    if (facturaExistente.estado === 'ANULADA') {
      return NextResponse.json({ error: 'La factura ya está anulada' }, { status: 400 })
    }

    // Anular la factura
    const factura = await prisma.factura.update({
      where: { id },
      data: { 
        estado: 'ANULADA',
        observaciones: `${facturaExistente.observaciones || ''}\n\nFACTURA ANULADA - ${new Date().toLocaleString('es-CO')}`
      },
      include: {
        cliente: true,
        orden: {
          include: {
            vehiculo: true
          }
        }
      }
    })

    return NextResponse.json(factura)
  } catch (error) {
    console.error('Error anulando factura:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}