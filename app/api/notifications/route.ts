import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Helper para crear/actualizar notificaciones del sistema
async function sincronizarNotificacionesSistema(
  usuarioId: string,
  userRole: string,
  mes: number,
  anio: number
) {
  const now = new Date()

  // ==================== PRODUCTOS CON STOCK BAJO ====================
  if (['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS'].includes(userRole)) {
    let whereClause: any = {
      isActive: true,
      stock: { lte: prisma.producto.fields.stockMinimo }
    }

    if (userRole === 'ADMIN_WAYRA_PRODUCTOS') {
      whereClause.tipo = { in: ['WAYRA_ENI', 'WAYRA_CALAN'] }
    } else if (userRole === 'ADMIN_TORNI_REPUESTOS') {
      whereClause.tipo = { in: ['TORNI_REPUESTO', 'TORNILLERIA'] }
    }

    const lowStockProducts = await prisma.producto.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        stock: true,
        stockMinimo: true,
        tipo: true,
        categoria: true,
        updatedAt: true
      }
    })

    for (const product of lowStockProducts) {
      const updateDate = new Date(product.updatedAt)
      const productMonth = updateDate.getMonth() + 1
      const productYear = updateDate.getFullYear()

      if (productYear !== anio || productMonth !== mes) continue

      // Buscar o crear notificación
      let notificacion = await prisma.notificacion.findFirst({
        where: {
          entidad: 'Producto',
          entidadId: product.id,
          categoria: 'stock',
          mes: productMonth,
          anio: productYear
        }
      })

      if (!notificacion) {
        notificacion = await prisma.notificacion.create({
          data: {
            titulo: '⚠️ Stock Bajo',
            mensaje: `${product.nombre} - Solo quedan ${product.stock} unidades (mínimo: ${product.stockMinimo})`,
            tipo: 'warning',
            categoria: 'stock',
            prioridad: product.stock === 0 ? 'high' : 'medium',
            entidad: 'Producto',
            entidadId: product.id,
            accion: 'STOCK_BAJO',
            mes: productMonth,
            anio: productYear,
            data: {
              productId: product.id,
              currentStock: product.stock,
              minStock: product.stockMinimo,
              tipo: product.tipo
            }
          }
        })
      }

      // Verificar si el usuario ya tiene esta notificación
      const existeRelacion = await prisma.notificacionUsuario.findUnique({
        where: {
          notificacionId_usuarioId: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        }
      })

      if (!existeRelacion) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        })
      }
    }
  }

  // ==================== MOVIMIENTOS RECIENTES ====================
  if (['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_WAYRA', 'VENDEDOR_TORNI'].includes(userRole)) {
    let whereClause: any = {}

    if (userRole === 'ADMIN_WAYRA_PRODUCTOS' || userRole === 'VENDEDOR_WAYRA') {
      whereClause.producto = {
        tipo: { in: ['WAYRA_ENI', 'WAYRA_CALAN'] }
      }
    } else if (userRole === 'ADMIN_TORNI_REPUESTOS' || userRole === 'VENDEDOR_TORNI') {
      whereClause.producto = {
        tipo: { in: ['TORNI_REPUESTO', 'TORNILLERIA'] }
      }
    }

    const startDate = new Date(anio, mes - 1, 1)
    const endDate = new Date(anio, mes, 0, 23, 59, 59)
    whereClause.fecha = { gte: startDate, lte: endDate }

    const recentMovements = await prisma.movimientoInventario.findMany({
      where: whereClause,
      take: 20,
      orderBy: { fecha: 'desc' },
      include: {
        producto: {
          select: { nombre: true, codigo: true, tipo: true }
        },
        usuario: {
          select: { name: true }
        }
      }
    })

    for (const movement of recentMovements) {
      const movDate = new Date(movement.fecha)
      const movMonth = movDate.getMonth() + 1
      const movYear = movDate.getFullYear()

      let notificacion = await prisma.notificacion.findFirst({
        where: {
          entidad: 'MovimientoInventario',
          entidadId: movement.id,
          categoria: 'inventory'
        }
      })

      const icon = movement.tipo === 'ENTRADA' ? '📦' : movement.tipo === 'SALIDA' ? '📤' : '⚙️'

      if (!notificacion) {
        notificacion = await prisma.notificacion.create({
          data: {
            titulo: `${icon} ${movement.tipo === 'ENTRADA' ? 'Entrada' : movement.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'} de Inventario`,
            mensaje: `${movement.producto.nombre} - ${movement.cantidad} unidades por ${movement.usuario.name}`,
            tipo: movement.tipo === 'ENTRADA' ? 'success' : movement.tipo === 'SALIDA' ? 'info' : 'warning',
            categoria: 'inventory',
            prioridad: 'low',
            entidad: 'MovimientoInventario',
            entidadId: movement.id,
            accion: movement.tipo,
            mes: movMonth,
            anio: movYear,
            data: {
              movementId: movement.id,
              productName: movement.producto.nombre,
              quantity: movement.cantidad,
              type: movement.tipo
            }
          }
        })
      }

      const existeRelacion = await prisma.notificacionUsuario.findUnique({
        where: {
          notificacionId_usuarioId: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        }
      })

      if (!existeRelacion) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        })
      }
    }
  }

  // ==================== ÓRDENES PENDIENTES ====================
  if (['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(userRole)) {
    const pendingOrders = await prisma.ordenServicio.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
        mes: mes,
        anio: anio
      },
      take: 20,
      orderBy: { fechaCreacion: 'desc' },
      include: {
        cliente: { select: { nombre: true } },
        vehiculo: { select: { placa: true, marca: true, modelo: true } }
      }
    })

    for (const order of pendingOrders) {
      let notificacion = await prisma.notificacion.findFirst({
        where: {
          entidad: 'OrdenServicio',
          entidadId: order.id,
          categoria: 'orders'
        }
      })

      const isPending = order.estado === 'PENDIENTE'

      if (!notificacion) {
        notificacion = await prisma.notificacion.create({
          data: {
            titulo: isPending ? '🔔 Orden Pendiente' : '🔧 Orden En Proceso',
            mensaje: `${order.numeroOrden} - ${order.cliente.nombre} (${order.vehiculo.placa})`,
            tipo: isPending ? 'warning' : 'info',
            categoria: 'orders',
            prioridad: isPending ? 'high' : 'medium',
            entidad: 'OrdenServicio',
            entidadId: order.id,
            accion: order.estado,
            mes: order.mes,
            anio: order.anio,
            data: {
              orderId: order.id,
              numeroOrden: order.numeroOrden,
              estado: order.estado,
              cliente: order.cliente.nombre
            }
          }
        })
      }

      const existeRelacion = await prisma.notificacionUsuario.findUnique({
        where: {
          notificacionId_usuarioId: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        }
      })

      if (!existeRelacion) {
        await prisma.notificacionUsuario.create({
          data: {
            notificacionId: notificacion.id,
            usuarioId: usuarioId
          }
        })
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')

    const now = new Date()
    const currentYear = año ? parseInt(año) : now.getFullYear()
    const currentMonth = mes ? parseInt(mes) : now.getMonth() + 1

    // Sincronizar notificaciones del sistema
    await sincronizarNotificacionesSistema(
      session.user.id,
      session.user.role,
      currentMonth,
      currentYear
    )

    // Obtener notificaciones del usuario
    const notificacionesUsuario = await prisma.notificacionUsuario.findMany({
      where: {
        usuarioId: session.user.id,
        archivada: false,
        notificacion: {
          mes: currentMonth,
          anio: currentYear
        }
      },
      include: {
        notificacion: true
      },
      orderBy: [
        { leida: 'asc' },
        { notificacion: { createdAt: 'desc' } }
      ]
    })

    const notificaciones = notificacionesUsuario.map(nu => {
      const timeAgo = Math.floor((now.getTime() - new Date(nu.notificacion.createdAt).getTime()) / (1000 * 60))
      
      return {
        id: nu.id,
        notificacionId: nu.notificacion.id,
        title: nu.notificacion.titulo,
        message: nu.notificacion.mensaje,
        time: timeAgo < 60 ? `${timeAgo} min` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} h` : `${Math.floor(timeAgo / 1440)} d`,
        type: nu.notificacion.tipo,
        category: nu.notificacion.categoria,
        priority: nu.notificacion.prioridad,
        read: nu.leida,
        fecha: nu.notificacion.createdAt,
        data: nu.notificacion.data
      }
    })

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, action } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'IDs requeridos' }, { status: 400 })
    }

    if (action === 'mark_read') {
      await prisma.$transaction(
        notificationIds.map(id =>
          prisma.notificacionUsuario.update({
            where: { id: String(id) },
            data: {
              leida: true,
              fechaLeida: new Date()
            }
          })
        )
      )
      
      return NextResponse.json({ 
        success: true, 
        count: notificationIds.length,
        message: `${notificationIds.length} notificación(es) marcada(s) como leída(s)`
      })
    }

    if (action === 'mark_unread') {
      await prisma.$transaction(
        notificationIds.map(id =>
          prisma.notificacionUsuario.update({
            where: { id: String(id) },
            data: {
              leida: false,
              fechaLeida: null
            }
          })
        )
      )
      
      return NextResponse.json({ 
        success: true, 
        count: notificationIds.length,
        message: `${notificationIds.length} notificación(es) marcada(s) como no leída(s)` 
      })
    }

    if (action === 'archive') {
      await prisma.$transaction(
        notificationIds.map(id =>
          prisma.notificacionUsuario.update({
            where: { id: String(id) },
            data: {
              archivada: true,
              fechaArchivada: new Date()
            }
          })
        )
      )
      
      return NextResponse.json({ 
        success: true, 
        count: notificationIds.length,
        message: `${notificationIds.length} notificación(es) archivada(s)` 
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Error en PATCH /api/notifications:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}