import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { auditarEgreso, obtenerInfoRequest } from "@/lib/auditoria";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(
      searchParams.get("mes") || String(new Date().getMonth() + 1)
    );
    const año = parseInt(
      searchParams.get("año") || String(new Date().getFullYear())
    );

    // Obtener ingresos de productos vendidos (órdenes y ventas directas)
    const ingresosMovimientos = await prisma.movimientoContable.findMany({
      where: {
        tipo: "INGRESO",
        concepto: { in: ["VENTA_PRODUCTO", "VENTA_DESDE_ORDEN"] },
        entidad: "WAYRA_PRODUCTOS",
        mes,
        anio: año,
      },
      include: {
        detalleIngresos: {
          include: {
            producto: {
              select: {
                nombre: true,
                codigo: true,
                tipo: true,
              },
            },
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const ingresos = ingresosMovimientos.flatMap((mov) =>
      mov.detalleIngresos.map((detalle) => ({
        id: detalle.id,
        fecha: mov.fecha,
        cantidad: detalle.cantidad,
        descripcion: detalle.producto.nombre,
        tipo: detalle.producto.tipo,
        precioCompra: detalle.precioCompra,
        precioVenta: detalle.precioVenta,
        utilidad: detalle.utilidad,
        ordenId: mov.referencia?.startsWith("ORD-") ? mov.referencia : null,
        productoId: detalle.productoId,
        motivo: mov.descripcion,
      }))
    );

    // Obtener egresos
    const egresos = await prisma.movimientoContable.findMany({
      where: {
        tipo: "EGRESO",
        entidad: "WAYRA_PRODUCTOS",
        mes,
        anio: año,
      },
      include: {
        usuario: {
          select: { name: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const egresosFormato = egresos.map((e) => ({
      id: e.id,
      fecha: e.fecha,
      descripcion: e.descripcion,
      concepto: e.concepto,
      usuario: e.usuario.name,
      valor: e.monto,
    }));

    return NextResponse.json({
      ingresos,
      egresos: egresosFormato,
    });
  } catch (error) {
    console.error("Error fetching contabilidad wayra-productos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { descripcion, valor, concepto } = body;

    if (!descripcion || !valor || !concepto) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();
    const { ip, userAgent } = obtenerInfoRequest(request);

    const egreso = await prisma.movimientoContable.create({
      data: {
        tipo: "EGRESO",
        concepto,
        monto: parseFloat(valor),
        descripcion,
        entidad: "WAYRA_PRODUCTOS",
        mes,
        anio,
        usuarioId: session.user.id,
      },
      include: {
        usuario: {
          select: { name: true },
        },
      },
    });

    await auditarEgreso(
      descripcion,
      parseFloat(valor),
      "WAYRA_PRODUCTOS",
      session.user.id,
      ip,
      userAgent
    );

    return NextResponse.json(
      {
        id: egreso.id,
        fecha: egreso.fecha,
        descripcion: egreso.descripcion,
        concepto: egreso.concepto,
        usuario: egreso.usuario.name,
        valor: egreso.monto,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating egreso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await prisma.movimientoContable.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Egreso eliminado" });
  } catch (error) {
    console.error("Error deleting egreso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
