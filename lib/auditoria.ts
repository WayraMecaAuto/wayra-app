import { prisma } from '@/lib/db/prisma'

export type AccionAuditoria = 
  | 'CREAR'
  | 'EDITAR'
  | 'ELIMINAR'
  | 'VENTA'
  | 'ENTRADA_INVENTARIO'
  | 'SALIDA_INVENTARIO'
  | 'COMPLETAR_ORDEN'
  | 'CANCELAR_ORDEN'
  | 'GENERAR_FACTURA'
  | 'ANULAR_FACTURA'
  | 'CREAR_EGRESO'
  | 'OTRO'

interface RegistrarAuditoriaParams {
  accion: AccionAuditoria
  entidad: string
  entidadId?: string
  descripcion: string
  datosAnteriores?: any
  datosNuevos?: any
  usuarioId: string
  ip?: string
  userAgent?: string
}

export async function registrarAuditoria({
  accion,
  entidad,
  entidadId,
  descripcion,
  datosAnteriores,
  datosNuevos,
  usuarioId,
  ip,
  userAgent
}: RegistrarAuditoriaParams) {
  try {
    await prisma.auditoria.create({
      data: {
        accion,
        entidad,
        entidadId,
        descripcion,
        datosAnteriores: datosAnteriores || null,
        datosNuevos: datosNuevos || null,
        usuarioId,
        ip: ip || null,
        userAgent: userAgent || null
      }
    })
  } catch (error) {
    console.error('Error registrando auditoría:', error)
    // No lanzar error para no interrumpir el flujo normal
  }
}

// ==================== FUNCIONES HELPER ====================

export async function auditarCreacion(
  entidad: string,
  entidadId: string,
  datos: any,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: 'CREAR',
    entidad,
    entidadId,
    descripcion: `Creó ${entidad}`,
    datosNuevos: datos,
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarEdicion(
  entidad: string,
  entidadId: string,
  datosAnteriores: any,
  datosNuevos: any,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: 'EDITAR',
    entidad,
    entidadId,
    descripcion: `Editó ${entidad}`,
    datosAnteriores,
    datosNuevos,
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarEliminacion(
  entidad: string,
  entidadId: string,
  datos: any,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: 'ELIMINAR',
    entidad,
    entidadId,
    descripcion: `Eliminó ${entidad}`,
    datosAnteriores: datos,
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarVenta(
  productoNombre: string,
  cantidad: number,
  monto: number,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: 'VENTA',
    entidad: 'Venta',
    descripcion: `Vendió ${cantidad} unidad(es) de ${productoNombre} por $${monto.toLocaleString()}`,
    datosNuevos: { productoNombre, cantidad, monto },
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarMovimientoInventario(
  tipo: 'ENTRADA' | 'SALIDA',
  productoNombre: string,
  cantidad: number,
  motivo: string,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: tipo === 'ENTRADA' ? 'ENTRADA_INVENTARIO' : 'SALIDA_INVENTARIO',
    entidad: 'Inventario',
    descripcion: `${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de ${cantidad} unidad(es) de ${productoNombre}`,
    datosNuevos: { productoNombre, cantidad, motivo },
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarOrden(
  accion: 'COMPLETAR' | 'CANCELAR',
  numeroOrden: string,
  clienteNombre: string,
  total: number,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: accion === 'COMPLETAR' ? 'COMPLETAR_ORDEN' : 'CANCELAR_ORDEN',
    entidad: 'Orden',
    descripcion: `${accion === 'COMPLETAR' ? 'Completó' : 'Canceló'} orden ${numeroOrden} de ${clienteNombre}`,
    datosNuevos: { numeroOrden, clienteNombre, total },
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarFactura(
  accion: 'GENERAR' | 'ANULAR',
  numeroFactura: string,
  clienteNombre: string,
  total: number,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: accion === 'GENERAR' ? 'GENERAR_FACTURA' : 'ANULAR_FACTURA',
    entidad: 'Factura',
    descripcion: `${accion === 'GENERAR' ? 'Generó' : 'Anuló'} factura ${numeroFactura} de ${clienteNombre}`,
    datosNuevos: { numeroFactura, clienteNombre, total },
    usuarioId,
    ip,
    userAgent
  })
}

export async function auditarEgreso(
  descripcion: string,
  monto: number,
  entidad: string,
  usuarioId: string,
  ip?: string,
  userAgent?: string
) {
  return registrarAuditoria({
    accion: 'CREAR_EGRESO',
    entidad: 'Egreso',
    descripcion: `Registró egreso en ${entidad}: ${descripcion}`,
    datosNuevos: { descripcion, monto, entidad },
    usuarioId,
    ip,
    userAgent
  })
}

// Helper para obtener IP y User Agent del request
export function obtenerInfoRequest(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ip, userAgent }
}