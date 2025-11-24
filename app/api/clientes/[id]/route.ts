import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  registrarAuditoria,
  auditarEdicion,
  auditarEliminacion,
  obtenerInfoRequest,
} from "@/lib/auditoria";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        vehiculos: {
          where: { isActive: true },
          select: { id: true, placa: true, marca: true, modelo: true },
        },
        _count: {
          select: { ordenes: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error fetching cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const clienteAnterior = await prisma.cliente.findUnique({
      where: { id },
    });

    const body = await request.json();
    const {
      nombre,
      telefono,
      email,
      direccion,
      tipoDocumento,
      numeroDocumento,
    } = body;

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre,
        telefono,
        email,
        direccion,
        tipoDocumento,
        numeroDocumento,
        updatedAt: new Date(),
      },
      include: {
        vehiculos: {
          where: { isActive: true },
          select: { id: true, placa: true, marca: true, modelo: true },
        },
      },
    });

    const { ip, userAgent } = obtenerInfoRequest(request);

    await auditarEdicion(
      "Cliente",
      cliente.id,
      {
        nombre: clienteAnterior?.nombre,
        telefono: clienteAnterior?.telefono,
        email: clienteAnterior?.email,
      },
      {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
      },
      session.user.id,
      ip,
      userAgent
    );

    return NextResponse.json(cliente);
  } catch (error) {
    console.error("Error updating cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← ¡Promise!
) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 1. Resolver params correctamente
    const { id } = await params;

    // 2. Obtener cliente ANTES de cualquier cambio
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        numeroDocumento: true,
        email: true,
        telefono: true,
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const { ip, userAgent } = obtenerInfoRequest(request);

    // 3. Contar órdenes y vehículos (¡ambos pueden bloquear hard delete!)
    const [ordenesCount, vehiculosCount] = await Promise.all([
      prisma.ordenServicio.count({ where: { clienteId: id } }),
      prisma.vehiculo.count({ where: { clienteId: id } }),
    ]);

    // Si tiene órdenes o vehículos → solo soft delete
    if (ordenesCount > 0 || vehiculosCount > 0) {
      await prisma.cliente.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await auditarEliminacion(
        "Cliente",
        cliente.id,
        {
          nombre: cliente.nombre,
          numeroDocumento: cliente.numeroDocumento,
          email: cliente.email,
          telefono: cliente.telefono,
          motivo: "Desactivado por tener órdenes o vehículos asociados",
        },
        session.user.id,
        ip,
        userAgent
      );

      return NextResponse.json({
        message: "Cliente desactivado (tiene datos relacionados)",
        tipo: "soft-delete",
      });
    }

    await prisma.cliente.delete({
      where: { id },
    });

    await auditarEliminacion(
      "Cliente",
      cliente.id,
      {
        nombre: cliente.nombre,
        numeroDocumento: cliente.numeroDocumento,
        email: cliente.email,
        telefono: cliente.telefono,
      },
      session.user.id,
      ip,
      userAgent,
    );

    return NextResponse.json({
      message: "Cliente eliminado permanentemente",
      tipo: "hard-delete",
    });

  } catch (error: any) {
    console.error("Error deleting cliente:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "No se puede eliminar el cliente porque tiene vehículos u órdenes asociadas",
          sugerencia: "Desactívalo en su lugar",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}