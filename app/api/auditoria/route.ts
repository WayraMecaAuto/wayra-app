import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo SUPER_USUARIO puede ver auditoría
    if (!session || session.user.role !== 'SUPER_USUARIO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Filtros
    const usuarioId = searchParams.get('usuarioId')
    const entidad = searchParams.get('entidad')
    const accion = searchParams.get('accion')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    // Construir filtros
    let where: any = {}

    if (usuarioId) {
      where.usuarioId = usuarioId
    }

    if (entidad) {
      where.entidad = entidad
    }

    if (accion) {
      where.accion = accion
    }

    if (fechaInicio || fechaFin) {
      where.createdAt = {}
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        const fecha = new Date(fechaFin)
        fecha.setHours(23, 59, 59, 999)
        where.createdAt.lte = fecha
      }
    }

    // Obtener registros con paginación
    const [auditorias, total] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditoria.count({ where })
    ])

    // Obtener estadísticas
    const estadisticas = await prisma.auditoria.groupBy({
      by: ['accion'],
      _count: true,
      where
    })

    return NextResponse.json({
      auditorias,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      estadisticas: estadisticas.map(e => ({
        accion: e.accion,
        cantidad: e._count
      }))
    })
  } catch (error) {
    console.error('Error fetching auditoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Endpoint para exportar auditoría completa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_USUARIO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { fechaInicio, fechaFin } = body

    let where: any = {}

    if (fechaInicio || fechaFin) {
      where.createdAt = {}
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        const fecha = new Date(fechaFin)
        fecha.setHours(23, 59, 59, 999)
        where.createdAt.lte = fecha
      }
    }

    const auditorias = await prisma.auditoria.findMany({
      where,
      include: {
        usuario: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ auditorias })
  } catch (error) {
    console.error('Error exporting auditoría:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}