// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')

    const userRole = session.user.role

    // Obtener IDs de notificaciones OCULTAS (leídas y que el usuario no quiere ver más)
    const hiddenNotifications = await prisma.notificacionUsuario.findMany({
      where: {
        usuarioId: session.user.id,
        leida: true
      },
      select: { notificacionId: true }
    })
    
    const hiddenIds = new Set(hiddenNotifications.map(n => n.notificacionId))

    const notifications: any[] = []
    const now = new Date()
    const currentYear = año ? parseInt(año) : now.getFullYear()
    const currentMonth = mes ? parseInt(mes) : now.getMonth() + 1

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
        },
        orderBy: { updatedAt: 'desc' }
      })

      for (const product of lowStockProducts) {
        const updateDate = new Date(product.updatedAt)
        const productYear = updateDate.getFullYear()
        const productMonth = updateDate.getMonth() + 1

        // Filtrar por mes/año si se especifica
        if (mes && año) {
          if (productYear !== currentYear || productMonth !== currentMonth) {
            continue
          }
        }

        const notificationId = `stock-${product.id}`
        
        // Si está oculta, no mostrarla
        if (hiddenIds.has(notificationId)) {
          continue
        }

        const timeAgo = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60))
        
        notifications.push({
          id: notificationId,
          title: '⚠️ Stock Bajo',
          message: `${product.nombre} - Solo quedan ${product.stock} unidades (mínimo: ${product.stockMinimo})`,
          time: timeAgo < 60 ? `${timeAgo} min` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} h` : `${Math.floor(timeAgo / 1440)} d`,
          type: 'warning',
          category: 'stock',
          priority: product.stock === 0 ? 'high' : 'medium',
          read: false,
          fecha: product.updatedAt,
          data: {
            productId: product.id,
            currentStock: product.stock,
            minStock: product.stockMinimo,
            tipo: product.tipo
          }
        })
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

      // Filtrar por mes/año
      if (mes && año) {
        const startDate = new Date(currentYear, currentMonth - 1, 1)
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        whereClause.fecha = { gte: startDate, lte: endDate }
      } else {
        // Solo últimos 7 días si no hay filtro
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        whereClause.fecha = { gte: sevenDaysAgo }
      }

      const recentMovements = await prisma.movimientoInventario.findMany({
        where: whereClause,
        take: 50,
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
        const notificationId = `movement-${movement.id}`
        
        if (hiddenIds.has(notificationId)) {
          continue
        }

        const timeAgo = Math.floor((now.getTime() - new Date(movement.fecha).getTime()) / (1000 * 60))
        const icon = movement.tipo === 'ENTRADA' ? '📦' : movement.tipo === 'SALIDA' ? '📤' : '⚙️'
        
        notifications.push({
          id: notificationId,
          title: `${icon} ${movement.tipo === 'ENTRADA' ? 'Entrada' : movement.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'} de Inventario`,
          message: `${movement.producto.nombre} - ${movement.cantidad} unidades por ${movement.usuario.name}`,
          time: timeAgo < 60 ? `${timeAgo} min` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} h` : `${Math.floor(timeAgo / 1440)} d`,
          type: movement.tipo === 'ENTRADA' ? 'success' : movement.tipo === 'SALIDA' ? 'info' : 'warning',
          category: 'inventory',
          priority: 'low',
          read: false,
          fecha: movement.fecha,
          data: {
            movementId: movement.id,
            productName: movement.producto.nombre,
            quantity: movement.cantidad,
            type: movement.tipo,
            tipo: movement.producto.tipo
          }
        })
      }
    }

    // ==================== ÓRDENES RECIENTES ====================
    if (['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(userRole)) {
      let whereClause: any = {
        estado: { in: ['PENDIENTE', 'EN_PROCESO'] }
      }

      // Filtrar por mes/año
      if (mes && año) {
        whereClause.mes = currentMonth
        whereClause.anio = currentYear
      }

      const recentOrders = await prisma.ordenServicio.findMany({
        where: whereClause,
        take: 50,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          cliente: { select: { nombre: true } },
          vehiculo: { select: { placa: true, marca: true, modelo: true } },
          mecanico: { select: { name: true } }
        }
      })

      for (const order of recentOrders) {
        const notificationId = `order-${order.id}`
        
        if (hiddenIds.has(notificationId)) {
          continue
        }

        const timeAgo = Math.floor((now.getTime() - new Date(order.fechaCreacion).getTime()) / (1000 * 60))
        const isPending = order.estado === 'PENDIENTE'
        
        notifications.push({
          id: notificationId,
          title: isPending ? '🔔 Orden Pendiente' : '🔧 Orden En Proceso',
          message: `${order.numeroOrden} - ${order.cliente.nombre} (${order.vehiculo.placa})`,
          time: timeAgo < 60 ? `${timeAgo} min` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} h` : `${Math.floor(timeAgo / 1440)} d`,
          type: isPending ? 'warning' : 'info',
          category: 'orders',
          priority: isPending && timeAgo > 120 ? 'high' : 'medium',
          read: false,
          fecha: order.fechaCreacion,
          data: {
            orderId: order.id,
            numeroOrden: order.numeroOrden,
            estado: order.estado,
            cliente: order.cliente.nombre,
            vehiculo: `${order.vehiculo.marca} ${order.vehiculo.modelo}`
          }
        })
      }
    }

    // ==================== FACTURAS PENDIENTES ====================
    if (['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(userRole)) {
      let whereClause: any = {
        estado: 'PENDIENTE'
      }

      // Filtrar por mes/año
      if (mes && año) {
        const startDate = new Date(currentYear, currentMonth - 1, 1)
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        whereClause.fecha = { gte: startDate, lte: endDate }
      }

      const pendingInvoices = await prisma.factura.findMany({
        where: whereClause,
        take: 50,
        orderBy: { fecha: 'desc' },
        include: {
          cliente: { select: { nombre: true } }
        }
      })

      for (const invoice of pendingInvoices) {
        const notificationId = `invoice-${invoice.id}`
        
        if (hiddenIds.has(notificationId)) {
          continue
        }

        const timeAgo = Math.floor((now.getTime() - new Date(invoice.fecha).getTime()) / (1000 * 60))
        const isOverdue = invoice.vencimiento && new Date(invoice.vencimiento) < now
        
        notifications.push({
          id: notificationId,
          title: isOverdue ? '💸 Factura Vencida' : '🧾 Factura Pendiente',
          message: `${invoice.numeroFactura} - ${invoice.cliente.nombre} ($${invoice.total.toLocaleString()})`,
          time: timeAgo < 60 ? `${timeAgo} min` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)} h` : `${Math.floor(timeAgo / 1440)} d`,
          type: isOverdue ? 'error' : 'warning',
          category: 'billing',
          priority: isOverdue ? 'high' : 'medium',
          read: false,
          fecha: invoice.fecha,
          data: {
            invoiceId: invoice.id,
            numeroFactura: invoice.numeroFactura,
            total: invoice.total,
            isOverdue
          }
        })
      }
    }

    // ==================== USUARIOS NUEVOS ====================
    if (userRole === 'SUPER_USUARIO') {
      let whereClause: any = {}

      if (mes && año) {
        const startDate = new Date(currentYear, currentMonth - 1, 1)
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        whereClause.createdAt = { gte: startDate, lte: endDate }
      } else {
        // Solo últimos 30 días si no hay filtro
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        whereClause.createdAt = { gte: thirtyDaysAgo }
      }

      const newUsers = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      for (const user of newUsers) {
        const notificationId = `user-${user.id}`
        
        if (hiddenIds.has(notificationId)) {
          continue
        }

        const timeAgo = Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60))
        
        notifications.push({
          id: notificationId,
          title: '👤 Nuevo Usuario',
          message: `${user.name} se registró como ${user.role.replace(/_/g, ' ')}`,
          time: timeAgo < 1 ? 'Hace poco' : timeAgo < 24 ? `${timeAgo} h` : `${Math.floor(timeAgo / 24)} d`,
          type: 'info',
          category: 'users',
          priority: 'low',
          read: false,
          fecha: user.createdAt,
          data: {
            userId: user.id,
            userName: user.name,
            userRole: user.role
          }
        })
      }
    }

    // Ordenar por prioridad y fecha
    const sortedNotifications = notifications.sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      
      // Luego por fecha (más reciente primero)
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    })

    return NextResponse.json(sortedNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      console.error('❌ Error parseando JSON:', e)
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const { notificationIds, action } = body

    console.log('📥 PATCH recibido:', { 
      action, 
      idsCount: Array.isArray(notificationIds) ? notificationIds.length : 0,
      userId: session.user.id
    })

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      console.error('❌ notificationIds no es array o está vacío')
      return NextResponse.json({ 
        error: 'Se requiere un array de IDs',
        received: typeof notificationIds
      }, { status: 400 })
    }

    if (action !== 'mark_read' && action !== 'mark_unread') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    if (action === 'mark_read') {
      console.log(`📝 Marcando ${notificationIds.length} notificaciones como leídas...`)
      
      // Usar transacción para asegurar consistencia
      try {
        await prisma.$transaction(
          notificationIds.map(notificationId =>
            prisma.notificacionUsuario.upsert({
              where: {
                notificacionId_usuarioId: {
                  notificacionId: String(notificationId),
                  usuarioId: session.user.id
                }
              },
              update: {
                leida: true,
                fechaLeida: new Date()
              },
              create: {
                notificacionId: String(notificationId),
                usuarioId: session.user.id,
                leida: true,
                fechaLeida: new Date()
              }
            })
          ),
          {
            timeout: 10000 // 10 segundos timeout
          }
        )
        
        console.log(`✅ ${notificationIds.length} notificaciones marcadas correctamente`)
        
        return NextResponse.json({ 
          success: true, 
          count: notificationIds.length,
          message: `${notificationIds.length} notificación(es) marcada(s) como leída(s)`
        })
      } catch (dbError) {
        console.error('❌ Error en transacción de BD:', dbError)
        return NextResponse.json({ 
          error: 'Error guardando en base de datos',
          details: dbError instanceof Error ? dbError.message : 'Unknown'
        }, { status: 500 })
      }
    }

    if (action === 'mark_unread') {
      await prisma.notificacionUsuario.deleteMany({
        where: {
          notificacionId: { in: notificationIds.map(String) },
          usuarioId: session.user.id
        }
      })
      
      console.log(`✅ ${notificationIds.length} notificaciones desmarcadas`)
      
      return NextResponse.json({ 
        success: true, 
        count: notificationIds.length,
        message: `${notificationIds.length} notificación(es) marcada(s) como no leída(s)` 
      })
    }

    return NextResponse.json({ error: 'Acción no implementada' }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Error crítico en PATCH /api/notifications:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}