import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // CORRECCIÓN: Usar prisma.user en lugar de prisma.mecanico
    const mecanicos = await prisma.user.findMany({
      where: { 
        role: 'MECANICO',
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(mecanicos)
  } catch (error) {
    console.error('Error fetching mecanicos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}