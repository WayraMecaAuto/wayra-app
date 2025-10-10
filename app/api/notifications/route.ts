import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener notificaciones leídas del usuario
    const readNotifications = await prisma.notificacionUsuario.findMany({
      where: {
        usuarioId: session.user.id,
        leida: true
      },
      select: { notificacionId: true }
    })
    
    const readNotificationIds = new Set(readNotifications.map(n => n.notificacionId))

    const notifications = []
    const userRole = session.user.role

    // Productos con stock bajo - Solo para roles que manejan inventario
    if (['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS'].includes(userRole)) {
      let whereClause: any = {
        isActive: true,
        stock: { lte: prisma.producto.fields.stockMinimo }
      }

      // Filtrar por tipo según el rol
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
        take: 10,
        orderBy: { updatedAt: 'desc' }
      })

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
          read: readNotificationIds.has(notificationId),
          data: {
            productId: product.id,
            currentStock: product.stock,
            minStock: product.stockMinimo
          }
        })
      })
    }

    // Movimientos recientes - Solo para roles que manejan inventario
    if (['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_WAYRA', 'VENDEDOR_TORNI'].includes(userRole)) {
      let whereClause: any = {}

      // Filtrar movimientos según el rol
      if (userRole === 'ADMIN_WAYRA_PRODUCTOS' || userRole === 'VENDEDOR_WAYRA') {
        whereClause.producto = {
          tipo: { in: ['WAYRA_ENI', 'WAYRA_CALAN'] }
        }
      } else if (userRole === 'ADMIN_TORNI_REPUESTOS' || userRole === 'VENDEDOR_TORNI') {
        whereClause.producto = {
          tipo: { in: ['TORNI_REPUESTO', 'TORNILLERIA'] }
        }
      }

      const recentMovements = await prisma.movimientoInventario.findMany({
        where: whereClause,
        take: 5,
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
          read: readNotificationIds.has(notificationId),
          data: {
            movementId: movement.id,
            productName: movement.producto.nombre,
            quantity: movement.cantidad,
            type: movement.tipo
          }
        })
      })
    }

    // Usuarios nuevos - Solo para SUPER_USUARIO
    if (userRole === 'SUPER_USUARIO') {
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
          message: `${user.name} se registró como ${user.role}`,
          time: timeAgo < 1 ? 'Hace poco' : `${timeAgo} h`,
          type: 'info',
          category: 'users',
          priority: 'low',
          read: readNotificationIds.has(notificationId),
          data: {
            userId: user.id,
            userName: user.name,
            userRole: user.role
          }
        })
      })
    }

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
      // Crear o actualizar registros de notificaciones leídas
      for (const notificationId of notificationIds) {
        await prisma.notificacionUsuario.upsert({
          where: {
            notificacionId_usuarioId: {
              notificacionId,
              usuarioId: session.user.id
            }
          },
          update: {
            leida: true,
            fechaLeida: new Date()
          },
          create: {
            notificacionId,
            usuarioId: session.user.id,
            leida: true,
            fechaLeida: new Date()
          }
        })
      }
      
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