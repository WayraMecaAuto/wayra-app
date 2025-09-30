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

    // Obtener notificaciones leídas del usuario desde la base de datos
    // Si no tienes una tabla de notificaciones leídas, puedes usar localStorage del lado del cliente
    // Por ahora, vamos a obtener las notificaciones leídas desde el query parameter
    const url = new URL(request.url)
    const readNotificationsParam = url.searchParams.get('readNotifications')
    const readNotificationIds = readNotificationsParam ? JSON.parse(readNotificationsParam) : []

    // Obtener notificaciones reales
    type Notification = {
      id: string
      title: string
      message: string
      time: string
      type: string
      category: string
      priority: 'high' | 'medium' | 'low'
      read: boolean
      data: Record<string, any>
    }
    const notifications: Notification[] = []

    // Productos con stock bajo
    const lowStockProducts = await prisma.producto.findMany({
      where: {
        isActive: true,
        stock: { 
          lte: prisma.producto.fields.stockMinimo 
        }
      },
      select: {
        id: true,
        nombre: true,
        stock: true,
        stockMinimo: true,
        tipo: true,
        categoria: true,
        updatedAt: true
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    })

    // Crear notificaciones de stock bajo
    lowStockProducts.forEach(product => {
      const timeAgo = Math.floor((Date.now() - new Date(product.updatedAt).getTime()) / (1000 * 60))
      const notificationId = `stock-${product.id}`
      notifications.push({
        id: notificationId,
        title: '⚠️ Stock Bajo',
        message: `${product.nombre} - Solo quedan ${product.stock} unidades`,
        time: timeAgo < 60 ? `${timeAgo} min` : `${Math.floor(timeAgo / 60)} h`,
        type: 'warning',
        category: 'stock',
        priority: 'high',
        read: readNotificationIds.includes(notificationId),
        data: {
          productId: product.id,
          currentStock: product.stock,
          minStock: product.stockMinimo
        }
      })
    })

    // Movimientos recientes
    const recentMovements = await prisma.movimientoInventario.findMany({
      take: 5,
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

    recentMovements.forEach(movement => {
      const timeAgo = Math.floor((Date.now() - new Date(movement.fecha).getTime()) / (1000 * 60))
      const icon = movement.tipo === 'ENTRADA' ? '📦' : movement.tipo === 'SALIDA' ? '📤' : '⚙️'
      const notificationId = `movement-${movement.id}`
      notifications.push({
        id: notificationId,
        title: `${icon} ${movement.tipo === 'ENTRADA' ? 'Entrada' : movement.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'} de Inventario`,
        message: `${movement.producto.nombre} - ${movement.cantidad} unidades por ${movement.usuario.name}`,
        time: timeAgo < 60 ? `${timeAgo} min` : `${Math.floor(timeAgo / 60)} h`,
        type: movement.tipo === 'ENTRADA' ? 'success' : movement.tipo === 'SALIDA' ? 'info' : 'warning',
        category: 'inventory',
        priority: 'medium',
        read: readNotificationIds.includes(notificationId),
        data: {
          movementId: movement.id,
          productName: movement.producto.nombre,
          quantity: movement.cantidad,
          type: movement.tipo
        }
      })
    })

    // Usuarios nuevos (últimas 24 horas)
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    newUsers.forEach(user => {
      const timeAgo = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60))
      const notificationId = `user-${user.id}`
      notifications.push({
        id: notificationId,
        title: '👤 Nuevo Usuario',
        message: `${user.name} se registró como ${user.role === 'ADMIN' ? 'Administrador' : 'Mecánico'}`,
        time: timeAgo < 1 ? 'Hace poco' : `${timeAgo} h`,
        type: 'info',
        category: 'users',
        priority: 'low',
        read: readNotificationIds.includes(notificationId),
        data: {
          userId: user.id,
          userName: user.name,
          userRole: user.role
        }
      })
    })

    // Productos creados recientemente
    const recentProducts = await prisma.producto.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        categoria: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    recentProducts.forEach(product => {
      const timeAgo = Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60))
      const notificationId = `product-${product.id}`
      notifications.push({
        id: notificationId,
        title: '🆕 Nuevo Producto',
        message: `${product.nombre} agregado al inventario`,
        time: timeAgo < 1 ? 'Hace poco' : `${timeAgo} h`,
        type: 'success',
        category: 'products',
        priority: 'low',
        read: readNotificationIds.includes(notificationId),
        data: {
          productId: product.id,
          productName: product.nombre,
          productType: product.tipo
        }
      })
    })

    // Ordenar por prioridad y tiempo
    const sortedNotifications = notifications
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        const timeA = a.time === 'Ahora' || a.time === 'Hace poco' ? 0 : parseInt(a.time)
        const timeB = b.time === 'Ahora' || b.time === 'Hace poco' ? 0 : parseInt(b.time)
        return timeA - timeB
      })
      .slice(0, 15)

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

    const { notificationIds, action } = await request.json()

    if (action === 'mark_read') {
      // Marcar notificaciones como leídas
      // Por ahora solo simulamos, en una implementación real actualizarías la BD
      return NextResponse.json({ 
        success: true, 
        message: `${notificationIds.length} notificaciones marcadas como leídas` 
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}