import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_TALLER",
      "MECANICO",
    ].includes(session?.user?.role || "");
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const orden = await prisma.ordenServicio.findUnique({
      where: { id },
      include: {
        cliente: true,
        vehiculo: true,
        mecanico: {
          select: { id: true, name: true },
        },
        servicios: true,
        detalles: {
          include: {
            producto: true,
          },
        },
        repuestosExternos: true,
      },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error("Error fetching orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = await request.json();
    const { servicios, ...ordenData } = body;

    // Obtener orden actual
    const ordenActual = await prisma.ordenServicio.findUnique({
      where: { id },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    // No permitir editar órdenes completadas
    if (ordenActual?.estado === "COMPLETADO") {
      return NextResponse.json(
        {
          error: "No se pueden editar órdenes completadas",
        },
        { status: 403 }
      );
    }

    // Si es CANCELADO, eliminar la orden
    if (ordenData.estado === "CANCELADO") {
      await prisma.ordenServicio.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Orden cancelada y eliminada" });
    }

    // Actualizar servicios si se proporcionan
    if (servicios && Array.isArray(servicios)) {
      const serviciosActuales = await prisma.servicioOrden.findMany({
        where: { ordenId: id },
      });

      const serviciosNuevos = servicios.filter((s: any) => s.isNew && !s.id);
      const serviciosExistentes = servicios.filter(
        (s: any) => !s.isNew && s.id
      );
      const idsServiciosActualizados = serviciosExistentes.map(
        (s: any) => s.id
      );

      const serviciosAEliminar = serviciosActuales
        .filter((s) => !idsServiciosActualizados.includes(s.id))
        .map((s) => s.id);

      if (serviciosAEliminar.length > 0) {
        await prisma.servicioOrden.deleteMany({
          where: { id: { in: serviciosAEliminar } },
        });
      }

      for (const servicio of serviciosExistentes) {
        await prisma.servicioOrden.update({
          where: { id: servicio.id },
          data: {
            descripcion: servicio.descripcion,
            precio: parseFloat(servicio.precio),
          },
        });
      }

      if (serviciosNuevos.length > 0) {
        await prisma.servicioOrden.createMany({
          data: serviciosNuevos.map((s: any) => ({
            descripcion: s.descripcion,
            precio: parseFloat(s.precio),
            aplicaIva: false,
            ordenId: id,
          })),
        });
      }

      const todosLosServicios = await prisma.servicioOrden.findMany({
        where: { ordenId: id },
      });

      const subtotalServicios = todosLosServicios.reduce(
        (sum, s) => sum + s.precio,
        0
      );
      ordenData.subtotalServicios = subtotalServicios;

      const detalles = await prisma.detalleOrden.findMany({
        where: { ordenId: id },
      });
      const repuestos = await prisma.repuestoExterno.findMany({
        where: { ordenId: id },
      });

      const subtotalProductos = detalles.reduce(
        (sum, d) => sum + d.subtotal,
        0
      );
      const subtotalRepuestos = repuestos.reduce(
        (sum, r) => sum + r.subtotal,
        0
      );

      ordenData.subtotalProductos = subtotalProductos;
      ordenData.subtotalRepuestosExternos = subtotalRepuestos;
      ordenData.total =
        subtotalServicios +
        subtotalProductos +
        subtotalRepuestos +
        (ordenData.manoDeObra || 0);
    }

    // Actualizar la orden
    const orden = await prisma.ordenServicio.update({
      where: { id },
      data: ordenData,
      include: {
        cliente: true,
        vehiculo: true,
        mecanico: { select: { name: true } },
        servicios: true,
        detalles: {
          include: {
            producto: true,
          },
        },
        repuestosExternos: true,
      },
    });

    // Si se marca como COMPLETADA, registrar en contabilidad
    if (
      ordenData.estado === "COMPLETADO" &&
      ordenActual?.estado !== "COMPLETADO"
    ) {
      const ahora = new Date();
      const mes = ahora.getMonth() + 1;
      const anio = ahora.getFullYear();

      // 1. Registrar productos WAYRA en contabilidad WAYRA_PRODUCTOS
      const productosWayra = orden.detalles.filter(
        (d) =>
          d.producto.tipo === "WAYRA_ENI" || d.producto.tipo === "WAYRA_CALAN"
      );

      if (productosWayra.length > 0) {
        const totalWayra = productosWayra.reduce(
          (sum, d) => sum + d.subtotal,
          0
        );

        const movWayra = await prisma.movimientoContable.create({
          data: {
            tipo: "INGRESO",
            concepto: "VENTA_DESDE_ORDEN",
            monto: totalWayra,
            fecha: ahora,
            descripcion: `Productos Wayra - Orden ${orden.numeroOrden}`,
            entidad: "WAYRA_PRODUCTOS",
            referencia: orden.id,
            mes,
            anio,
            usuarioId: session.user.id,
          },
        });

        // Obtener tasa de cambio para conversión de CALAN
        let tasaDolar = 4000;
        try {
          const tasaConfig = await prisma.configuracion.findUnique({
            where: { clave: "TASA_USD_COP" },
          });
          tasaDolar = parseFloat(tasaConfig?.valor || "4000");
        } catch (error) {
          console.error("Error obteniendo tasa:", error);
        }

        for (const detalle of productosWayra) {
          // Convertir precio de compra si es CALAN
          let precioCompraContable = detalle.producto.precioCompra;
          if (
            detalle.producto.tipo === "WAYRA_CALAN" &&
            detalle.producto.monedaCompra === "USD"
          ) {
            precioCompraContable = detalle.producto.precioCompra * tasaDolar;
            console.log(
              `💱 Conversión CALAN en orden: $${detalle.producto.precioCompra} USD x ${tasaDolar} = $${precioCompraContable.toFixed(2)} COP`
            );
          }

          await prisma.detalleIngresoContable.create({
            data: {
              movimientoContableId: movWayra.id,
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              precioCompra: precioCompraContable, // Usar precio convertido
              precioVenta: detalle.precioUnitario,
              subtotalCompra: precioCompraContable * detalle.cantidad,
              subtotalVenta: detalle.subtotal,
              utilidad:
                detalle.subtotal - precioCompraContable * detalle.cantidad,
            },
          });
        }
      }

      // 2. Registrar productos TORNI_REPUESTO en contabilidad TORNIREPUESTOS
      const productosTorni = orden.detalles.filter(
        (d) =>
          d.producto.tipo === "TORNI_REPUESTO" ||
          d.producto.tipo === "TORNILLERIA"
      );

      if (productosTorni.length > 0) {
        const totalTorni = productosTorni.reduce(
          (sum, d) => sum + d.subtotal,
          0
        );

        const movTorni = await prisma.movimientoContable.create({
          data: {
            tipo: "INGRESO",
            concepto: "VENTA_DESDE_ORDEN",
            monto: totalTorni,
            fecha: ahora,
            descripcion: `Productos TorniRepuestos - Orden ${orden.numeroOrden}`,
            entidad: "TORNIREPUESTOS",
            referencia: orden.id,
            mes,
            anio,
            usuarioId: session.user.id,
          },
        });

        for (const detalle of productosTorni) {
          await prisma.detalleIngresoContable.create({
            data: {
              movimientoContableId: movTorni.id,
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              precioCompra: detalle.producto.precioCompra,
              precioVenta: detalle.precioUnitario,
              subtotalCompra: detalle.producto.precioCompra * detalle.cantidad,
              subtotalVenta: detalle.subtotal,
              utilidad:
                detalle.subtotal -
                detalle.producto.precioCompra * detalle.cantidad,
            },
          });
        }
      }
    }

    return NextResponse.json(orden);
  } catch (error) {
    console.error("Error updating orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
