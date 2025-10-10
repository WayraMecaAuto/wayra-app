import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Roles permitidos para cada tipo de movimiento
const ROLES_ENTRADA = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS']
const ROLES_SALIDA = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_WAYRA', 'VENDEDOR_TORNI']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Todos los roles pueden consultar movimientos
    const movimientos = await prisma.movimientoInventario.findMany({
      take: 50,
      orderBy: { fecha: 'desc' },
      include: {
        producto: {
          select: { nombre: true, codigo: true }
        },
        usuario: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error fetching movimientos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { productoId, tipo, cantidad, motivo, precioUnitario } = body
    const userRole = session.user.role

    // Validaciones de campos requeridos
    if (!productoId || !tipo || !cantidad) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Validar permisos según tipo de movimiento
    if (tipo === 'ENTRADA' && !ROLES_ENTRADA.includes(userRole)) {
      return NextResponse.json({
        error: 'No tienes permisos para registrar entradas de inventario. Solo administradores pueden realizar esta acción.'
      }, { status: 403 })
    }

    if (tipo === 'SALIDA' && !ROLES_SALIDA.includes(userRole)) {
      return NextResponse.json({
        error: 'No tienes permisos para registrar salidas de inventario.'
      }, { status: 403 })
    }

    // Convertir cantidad a número entero
    const cantidadNum = parseInt(cantidad.toString())
    const precioUnitarioNum = precioUnitario && precioUnitario !== '' ? parseFloat(precioUnitario.toString()) : null

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
    }

    // Obtener producto actual
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Validar stock para salidas
    if (tipo === 'SALIDA' && producto.stock < cantidadNum) {
      return NextResponse.json({
        error: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cantidadNum}`
      }, { status: 400 })
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stock
    if (tipo === 'ENTRADA') {
      nuevoStock += cantidadNum
    } else if (tipo === 'SALIDA') {
      nuevoStock -= cantidadNum
    }

    // Crear movimiento y actualizar stock en una transacción
    const movimiento = await prisma.$transaction(async (tx) => {
      // Crear el movimiento
      const nuevoMovimiento = await tx.movimientoInventario.create({
        data: {
          tipo,
          cantidad: cantidadNum,
          motivo: motivo || 'Sin motivo especificado',
          precioUnitario: precioUnitarioNum,
          total: precioUnitarioNum ? precioUnitarioNum * cantidadNum : null,
          productoId,
          usuarioId: session.user.id
        },
        include: {
          producto: {
            select: { nombre: true, codigo: true }
          },
          usuario: {
            select: { name: true }
          }
        }
      })

      // Actualizar stock del producto
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: nuevoStock }
      })

      return nuevoMovimiento
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('Error creating movimiento:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}