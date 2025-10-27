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
      tipo,
      concepto,
      monto,
      descripcion,
      entidad,
      referencia,
      mes,
      anio
    } = body

    if (!tipo || !concepto || !monto || !descripcion || !entidad) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const movimiento = await prisma.movimientoContable.create({
      data: {
        tipo,
        concepto,
        monto: parseFloat(monto),
        descripcion,
        entidad,
        referencia: referencia || null,
        mes: mes || new Date().getMonth() + 1,
        anio: anio || new Date().getFullYear(),
        usuarioId: session.user.id
      }
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('Error creating movimiento contable:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}