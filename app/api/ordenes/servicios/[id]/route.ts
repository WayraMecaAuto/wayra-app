// app/api/ordenes/servicios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Mecánicos y admins pueden marcar servicios como completados
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { completado } = body

    // Actualizar el servicio
    const servicio = await prisma.servicioOrden.update({
      where: { id },
      data: {
        completado: completado
      }
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error updating servicio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}