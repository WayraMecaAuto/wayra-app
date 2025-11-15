import { prisma } from '@/lib/db/prisma'

export type NotificationType = 'success' | 'warning' | 'info' | 'error'
export type NotificationCategory = 
  | 'users' 
  | 'inventory' 
  | 'orders' 
  | 'products' 
  | 'clients' 
  | 'vehicles' 
  | 'billing'
  | 'accounting'
  | 'stock'

export type NotificationPriority = 'low' | 'medium' | 'high'

interface CreateNotificationParams {
  titulo: string
  mensaje: string
  tipo: NotificationType
  categoria: NotificationCategory
  prioridad: NotificationPriority
  data?: any
  usuarioId?: string // Si no se especifica, se notifica a todos los usuarios relevantes
}

/**
 * Crea una notificación en el sistema
 */
export async function createNotification({
  titulo,
  mensaje,
  tipo,
  categoria,
  prioridad,
  data,
  usuarioId
}: CreateNotificationParams) {
  try {
    // Crear la notificación
    const notificacion = await prisma.notificacion.create({
      data: {
        titulo,
        mensaje,
        tipo,
        categoria,
        prioridad,
        data: data || {}
      }
    })

    // Si se especifica un usuario, crear relación específica
    if (usuarioId) {
      await prisma.notificacionUsuario.create({
        data: {
          notificacionId: notificacion.id,
          usuarioId,
          leida: false
        }
      })
    }

    return notificacion
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// ==================== USUARIOS ====================
export async function notifyUserCreated(userName: string, userRole: string) {
  return createNotification({
    titulo: '👤 Nuevo Usuario Creado',
    mensaje: `Se ha registrado ${userName} como ${userRole}`,
    tipo: 'success',
    categoria: 'users',
    prioridad: 'low',
    data: { userName, userRole }
  })
}

export async function notifyUserUpdated(userName: string, changes: string) {
  return createNotification({
    titulo: '✏️ Usuario Actualizado',
    mensaje: `Se actualizó el perfil de ${userName}: ${changes}`,
    tipo: 'info',
    categoria: 'users',
    prioridad: 'low',
    data: { userName, changes }
  })
}

export async function notifyUserDeactivated(userName: string) {
  return createNotification({
    titulo: '🔒 Usuario Desactivado',
    mensaje: `El usuario ${userName} ha sido desactivado`,
    tipo: 'warning',
    categoria: 'users',
    prioridad: 'medium',
    data: { userName }
  })
}

export async function notifyUserReactivated(userName: string) {
  return createNotification({
    titulo: '✅ Usuario Reactivado',
    mensaje: `El usuario ${userName} ha sido reactivado`,
    tipo: 'success',
    categoria: 'users',
    prioridad: 'medium',
    data: { userName }
  })
}

export async function notifyUserDeleted(userName: string) {
  return createNotification({
    titulo: '🗑️ Usuario Eliminado',
    mensaje: `El usuario ${userName} ha sido eliminado permanentemente`,
    tipo: 'error',
    categoria: 'users',
    prioridad: 'high',
    data: { userName }
  })
}

// ==================== INVENTARIO ====================
export async function notifyStockLow(productName: string, currentStock: number, minStock: number) {
  return createNotification({
    titulo: '⚠️ Stock Bajo',
    mensaje: `${productName} tiene stock bajo: ${currentStock}/${minStock} unidades`,
    tipo: 'warning',
    categoria: 'stock',
    prioridad: 'high',
    data: { productName, currentStock, minStock }
  })
}

export async function notifyStockEntry(productName: string, cantidad: number, usuario: string) {
  return createNotification({
    titulo: '📦 Entrada de Inventario',
    mensaje: `${usuario} agregó ${cantidad} unidades de ${productName}`,
    tipo: 'success',
    categoria: 'inventory',
    prioridad: 'medium',
    data: { productName, cantidad, usuario }
  })
}

export async function notifyStockExit(productName: string, cantidad: number, usuario: string) {
  return createNotification({
    titulo: '📤 Salida de Inventario',
    mensaje: `${usuario} retiró ${cantidad} unidades de ${productName}`,
    tipo: 'info',
    categoria: 'inventory',
    prioridad: 'medium',
    data: { productName, cantidad, usuario }
  })
}

export async function notifyProductCreated(productName: string, tipo: string) {
  return createNotification({
    titulo: '🆕 Nuevo Producto',
    mensaje: `Se agregó ${productName} al inventario de ${tipo}`,
    tipo: 'success',
    categoria: 'products',
    prioridad: 'low',
    data: { productName, tipo }
  })
}

export async function notifyProductUpdated(productName: string, changes: string) {
  return createNotification({
    titulo: '✏️ Producto Actualizado',
    mensaje: `Se actualizó ${productName}: ${changes}`,
    tipo: 'info',
    categoria: 'products',
    prioridad: 'low',
    data: { productName, changes }
  })
}

export async function notifyProductDeleted(productName: string) {
  return createNotification({
    titulo: '🗑️ Producto Eliminado',
    mensaje: `Se eliminó ${productName} del inventario`,
    tipo: 'warning',
    categoria: 'products',
    prioridad: 'medium',
    data: { productName }
  })
}

// ==================== ÓRDENES ====================
export async function notifyOrderCreated(numeroOrden: string, cliente: string, vehiculo: string) {
  return createNotification({
    titulo: '🔧 Nueva Orden Creada',
    mensaje: `Orden ${numeroOrden} para ${cliente} - ${vehiculo}`,
    tipo: 'success',
    categoria: 'orders',
    prioridad: 'high',
    data: { numeroOrden, cliente, vehiculo }
  })
}

export async function notifyOrderUpdated(numeroOrden: string, estado: string) {
  return createNotification({
    titulo: '📝 Orden Actualizada',
    mensaje: `Orden ${numeroOrden} cambió a estado: ${estado}`,
    tipo: 'info',
    categoria: 'orders',
    prioridad: 'medium',
    data: { numeroOrden, estado }
  })
}

export async function notifyOrderCompleted(numeroOrden: string, cliente: string, total: number) {
  return createNotification({
    titulo: '✅ Orden Completada',
    mensaje: `Orden ${numeroOrden} de ${cliente} completada - Total: $${total.toLocaleString()}`,
    tipo: 'success',
    categoria: 'orders',
    prioridad: 'high',
    data: { numeroOrden, cliente, total }
  })
}

export async function notifyOrderCancelled(numeroOrden: string) {
  return createNotification({
    titulo: '❌ Orden Cancelada',
    mensaje: `La orden ${numeroOrden} ha sido cancelada`,
    tipo: 'warning',
    categoria: 'orders',
    prioridad: 'medium',
    data: { numeroOrden }
  })
}

// ==================== CLIENTES ====================
export async function notifyClientCreated(clientName: string) {
  return createNotification({
    titulo: '👥 Nuevo Cliente',
    mensaje: `Se registró el cliente ${clientName}`,
    tipo: 'success',
    categoria: 'clients',
    prioridad: 'low',
    data: { clientName }
  })
}

export async function notifyClientUpdated(clientName: string) {
  return createNotification({
    titulo: '✏️ Cliente Actualizado',
    mensaje: `Se actualizó la información de ${clientName}`,
    tipo: 'info',
    categoria: 'clients',
    prioridad: 'low',
    data: { clientName }
  })
}

export async function notifyClientDeleted(clientName: string) {
  return createNotification({
    titulo: '🗑️ Cliente Eliminado',
    mensaje: `Se eliminó el cliente ${clientName}`,
    tipo: 'warning',
    categoria: 'clients',
    prioridad: 'low',
    data: { clientName }
  })
}

// ==================== VEHÍCULOS ====================
export async function notifyVehicleCreated(placa: string, marca: string, modelo: string) {
  return createNotification({
    titulo: '🚗 Nuevo Vehículo',
    mensaje: `Se registró el vehículo ${marca} ${modelo} - ${placa}`,
    tipo: 'success',
    categoria: 'vehicles',
    prioridad: 'low',
    data: { placa, marca, modelo }
  })
}

export async function notifyVehicleUpdated(placa: string) {
  return createNotification({
    titulo: '✏️ Vehículo Actualizado',
    mensaje: `Se actualizó el vehículo con placa ${placa}`,
    tipo: 'info',
    categoria: 'vehicles',
    prioridad: 'low',
    data: { placa }
  })
}

export async function notifyVehicleDeleted(placa: string) {
  return createNotification({
    titulo: '🗑️ Vehículo Eliminado',
    mensaje: `Se eliminó el vehículo con placa ${placa}`,
    tipo: 'warning',
    categoria: 'vehicles',
    prioridad: 'low',
    data: { placa }
  })
}

// ==================== FACTURACIÓN ====================
export async function notifyInvoiceCreated(numeroFactura: string, cliente: string, total: number) {
  return createNotification({
    titulo: '🧾 Nueva Factura',
    mensaje: `Factura ${numeroFactura} generada para ${cliente} - Total: $${total.toLocaleString()}`,
    tipo: 'success',
    categoria: 'billing',
    prioridad: 'high',
    data: { numeroFactura, cliente, total }
  })
}

export async function notifyInvoicePaid(numeroFactura: string) {
  return createNotification({
    titulo: '💰 Factura Pagada',
    mensaje: `La factura ${numeroFactura} ha sido pagada`,
    tipo: 'success',
    categoria: 'billing',
    prioridad: 'medium',
    data: { numeroFactura }
  })
}

export async function notifyInvoiceCancelled(numeroFactura: string) {
  return createNotification({
    titulo: '❌ Factura Anulada',
    mensaje: `La factura ${numeroFactura} ha sido anulada`,
    tipo: 'warning',
    categoria: 'billing',
    prioridad: 'medium',
    data: { numeroFactura }
  })
}

// ==================== CONTABILIDAD ====================
export async function notifyExpenseCreated(descripcion: string, monto: number, entidad: string) {
  return createNotification({
    titulo: '💸 Nuevo Egreso',
    mensaje: `Egreso registrado en ${entidad}: ${descripcion} - $${monto.toLocaleString()}`,
    tipo: 'warning',
    categoria: 'accounting',
    prioridad: 'medium',
    data: { descripcion, monto, entidad }
  })
}

export async function notifyIncomeCreated(descripcion: string, monto: number, entidad: string) {
  return createNotification({
    titulo: '💵 Nuevo Ingreso',
    mensaje: `Ingreso registrado en ${entidad}: ${descripcion} - $${monto.toLocaleString()}`,
    tipo: 'success',
    categoria: 'accounting',
    prioridad: 'medium',
    data: { descripcion, monto, entidad }
  })
}