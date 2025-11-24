import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { registrarAuditoria, obtenerInfoRequest } from "@/lib/auditoria";
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Solo SUPER_USUARIO puede editar usuarios
    if (!session || session.user.role !== 'SUPER_USUARIO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Si se está actualizando la contraseña, encriptarla
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 12)
    }

    // ✅ CAMBIO: Permitir actualizar cualquier campo, incluido isActive
    const user = await prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })

    const { ip, userAgent } = obtenerInfoRequest(request);
    
        await registrarAuditoria({
          accion: "EDITAR",
          entidad: "Usuario",
          entidadId: user.id,
          descripcion: `Editó usuario ${user.name} con rol ${user.role}`,
          datosNuevos: {
            nombre: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          },
          usuarioId: session.user.id,
          ip,
          userAgent,
        });
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_USUARIO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    if (session.user.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario' }, { status: 400 })
    }

    // 1. Primero obtener los datos del usuario antes de eliminarlo
    const usuarioAEliminar = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    })

    if (!usuarioAEliminar) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id }
    })

    const { ip, userAgent } = obtenerInfoRequest(request);
    
    await registrarAuditoria({
      accion: "ELIMINAR",
      entidad: "Usuario",
      entidadId: usuarioAEliminar.id,
      descripcion: `Eliminó usuario ${usuarioAEliminar.name} (${usuarioAEliminar.email}) con rol ${usuarioAEliminar.role}`,
      datosAnteriores: {
        nombre: usuarioAEliminar.name,
        email: usuarioAEliminar.email,
        role: usuarioAEliminar.role,
        isActive: usuarioAEliminar.isActive,
      },
      usuarioId: session.user.id,
      ip,
      userAgent,
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}