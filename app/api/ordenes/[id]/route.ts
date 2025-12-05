import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  registrarAuditoria,
  auditarOrden,
  obtenerInfoRequest,
} from "@/lib/auditoria";

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

    const hasAccess = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_TALLER",
      "MECANICO",
    ].includes(session?.user?.role || "");

    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      servicios,
      productosNuevos,
      productosActualizados,
      repuestosNuevos,
      repuestosActualizados,
      ...ordenData
    } = body;

    console.log("📥 Recibiendo actualización de orden:", {
      servicios: servicios?.length || 0,
      productosNuevos: productosNuevos?.length || 0,
      productosActualizados: productosActualizados?.length || 0,
      repuestosNuevos: repuestosNuevos?.length || 0,
      repuestosActualizados: repuestosActualizados?.length || 0,
    });

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

    const isMecanico = session?.user?.role === "MECANICO";

    if (isMecanico && servicios) {
      return NextResponse.json(
        { error: "Los mecánicos no pueden editar servicios directamente" },
        { status: 403 }
      );
    }

    if (isMecanico && ordenData.estado === "CANCELADO") {
      return NextResponse.json(
        { error: "Los mecánicos no pueden cancelar órdenes" },
        { status: 403 }
      );
    }

    if (ordenData.estado === "CANCELADO") {
      const { ip, userAgent } = obtenerInfoRequest(request);
      await auditarOrden(
        "CANCELAR",
        ordenActual?.numeroOrden || "",
        "",
        0,
        session.user.id,
        ip,
        userAgent
      );
    }

    // ✅ PROCESAR PRODUCTOS NUEVOS
    if (
      productosNuevos &&
      Array.isArray(productosNuevos) &&
      productosNuevos.length > 0
    ) {
      console.log("🆕 Agregando productos nuevos:", productosNuevos.length);

      for (const prod of productosNuevos) {
        const producto = await prisma.producto.findUnique({
          where: { id: prod.productoId },
        });

        if (!producto) {
          console.error(`❌ Producto ${prod.productoId} no encontrado`);
          continue;
        }

        if (producto.stock < prod.cantidad) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
            },
            { status: 400 }
          );
        }

        await prisma.detalleOrden.create({
          data: {
            ordenId: id,
            productoId: prod.productoId,
            cantidad: prod.cantidad,
            precioUnitario: prod.precioUnitario,
            tipoPrecio: "VENTA",
            subtotal: prod.precioUnitario * prod.cantidad,
          },
        });

        await prisma.producto.update({
          where: { id: prod.productoId },
          data: { stock: { decrement: prod.cantidad } },
        });

        await prisma.movimientoInventario.create({
          data: {
            tipo: "SALIDA",
            cantidad: prod.cantidad,
            motivo: `Agregado a orden ${ordenActual?.numeroOrden}`,
            precioUnitario: prod.precioUnitario,
            total: prod.precioUnitario * prod.cantidad,
            productoId: prod.productoId,
            usuarioId: session.user.id,
          },
        });

        console.log(
          `✅ Producto agregado: ${producto.nombre} x${prod.cantidad}`
        );
      }
    }

    // ✅ ACTUALIZAR PRODUCTOS EXISTENTES (precio y cantidad)
    if (
      productosActualizados &&
      Array.isArray(productosActualizados) &&
      productosActualizados.length > 0
    ) {
      console.log(
        "🔄 Actualizando productos existentes:",
        productosActualizados.length
      );

      for (const prod of productosActualizados) {
        const detalleActual = await prisma.detalleOrden.findUnique({
          where: { id: prod.detalleId },
        });

        if (!detalleActual) {
          console.error(`❌ Detalle ${prod.detalleId} no encontrado`);
          continue;
        }

        // Si cambió la cantidad, ajustar stock
        const diferenciaCantidad = prod.cantidad - detalleActual.cantidad;

        if (diferenciaCantidad !== 0) {
          const producto = await prisma.producto.findUnique({
            where: { id: detalleActual.productoId },
          });

          if (!producto) continue;

          // Si aumentó la cantidad, necesitamos más stock
          if (diferenciaCantidad > 0) {
            if (producto.stock < diferenciaCantidad) {
              return NextResponse.json(
                {
                  error: `Stock insuficiente para ${producto.nombre}. Necesitas ${diferenciaCantidad} más, disponible: ${producto.stock}`,
                },
                { status: 400 }
              );
            }

            // Decrementar stock
            await prisma.producto.update({
              where: { id: detalleActual.productoId },
              data: { stock: { decrement: diferenciaCantidad } },
            });

            await prisma.movimientoInventario.create({
              data: {
                tipo: "SALIDA",
                cantidad: diferenciaCantidad,
                motivo: `Ajuste de cantidad en orden ${ordenActual?.numeroOrden}`,
                precioUnitario: prod.precioUnitario,
                total: prod.precioUnitario * diferenciaCantidad,
                productoId: detalleActual.productoId,
                usuarioId: session.user.id,
              },
            });
          } else {
            // Si disminuyó la cantidad, devolver stock
            await prisma.producto.update({
              where: { id: detalleActual.productoId },
              data: { stock: { increment: Math.abs(diferenciaCantidad) } },
            });

            await prisma.movimientoInventario.create({
              data: {
                tipo: "ENTRADA",
                cantidad: Math.abs(diferenciaCantidad),
                motivo: `Ajuste de cantidad en orden ${ordenActual?.numeroOrden} (reducción)`,
                precioUnitario: prod.precioUnitario,
                total: prod.precioUnitario * Math.abs(diferenciaCantidad),
                productoId: detalleActual.productoId,
                usuarioId: session.user.id,
              },
            });
          }

          console.log(
            `📦 Stock ajustado: ${diferenciaCantidad > 0 ? "-" : "+"}${Math.abs(diferenciaCantidad)}`
          );
        }

        // Actualizar el detalle con nuevo precio y cantidad
        await prisma.detalleOrden.update({
          where: { id: prod.detalleId },
          data: {
            cantidad: prod.cantidad,
            precioUnitario: prod.precioUnitario,
            subtotal: prod.cantidad * prod.precioUnitario,
          },
        });

        console.log(
          `✅ Detalle actualizado: cantidad=${prod.cantidad}, precio=${prod.precioUnitario}`
        );
      }
    }

    // ✅ PROCESAR REPUESTOS NUEVOS
    if (
      repuestosNuevos &&
      Array.isArray(repuestosNuevos) &&
      repuestosNuevos.length > 0
    ) {
      console.log("🆕 Agregando repuestos nuevos:", repuestosNuevos.length);

      for (const rep of repuestosNuevos) {
        await prisma.repuestoExterno.create({
          data: {
            nombre: rep.nombre,
            descripcion: rep.descripcion || "",
            cantidad: rep.cantidad,
            precioCompra: rep.precioCompra || 0,
            precioVenta: rep.precioVenta,
            precioUnitario: rep.precioVenta,
            subtotal: rep.subtotal,
            utilidad: rep.utilidad || 0,
            proveedor: rep.proveedor || "",
            ordenId: id,
          },
        });

        console.log(`✅ Repuesto agregado: ${rep.nombre} x${rep.cantidad}`);
      }
    }

    // ✅ ACTUALIZAR REPUESTOS EXISTENTES (precio y cantidad)
    if (
      repuestosActualizados &&
      Array.isArray(repuestosActualizados) &&
      repuestosActualizados.length > 0
    ) {
      console.log(
        "🔄 Actualizando repuestos existentes:",
        repuestosActualizados.length
      );

      for (const rep of repuestosActualizados) {
        const nuevoSubtotal = rep.cantidad * rep.precioVenta;
        const nuevaUtilidad = nuevoSubtotal - rep.precioCompra * rep.cantidad;

        await prisma.repuestoExterno.update({
          where: { id: rep.repuestoId },
          data: {
            cantidad: rep.cantidad,
            precioVenta: rep.precioVenta,
            precioUnitario: rep.precioVenta,
            subtotal: nuevoSubtotal,
            utilidad: nuevaUtilidad,
          },
        });

        console.log(
          `✅ Repuesto actualizado: cantidad=${rep.cantidad}, precio=${rep.precioVenta}`
        );
      }
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
    }

    // ✅ RECALCULAR TOTALES
    const todosLosServicios = await prisma.servicioOrden.findMany({
      where: { ordenId: id },
    });
    const todosLosDetalles = await prisma.detalleOrden.findMany({
      where: { ordenId: id },
    });
    const todosLosRepuestos = await prisma.repuestoExterno.findMany({
      where: { ordenId: id },
    });

    const subtotalServicios = todosLosServicios.reduce(
      (sum, s) => sum + s.precio,
      0
    );
    const subtotalProductos = todosLosDetalles.reduce(
      (sum, d) => sum + d.subtotal,
      0
    );
    const subtotalRepuestos = todosLosRepuestos.reduce(
      (sum, r) => sum + r.subtotal,
      0
    );

    ordenData.subtotalServicios = subtotalServicios;
    ordenData.subtotalProductos = subtotalProductos;
    ordenData.subtotalRepuestosExternos = subtotalRepuestos;
    ordenData.total =
      subtotalServicios +
      subtotalProductos +
      subtotalRepuestos +
      (ordenData.manoDeObra || ordenActual?.manoDeObra || 0);

    console.log("💰 Totales recalculados:", {
      servicios: subtotalServicios,
      productos: subtotalProductos,
      repuestos: subtotalRepuestos,
      total: ordenData.total,
    });

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
      const { ip, userAgent } = obtenerInfoRequest(request);

      await auditarOrden(
        "COMPLETAR",
        orden.numeroOrden,
        orden.cliente.nombre,
        orden.total,
        session.user.id,
        ip,
        userAgent
      );
      const ahora = new Date();
      const mes = ahora.getMonth() + 1;
      const anio = ahora.getFullYear();

      let tasaDolar = 4000;
      try {
        const tasaConfig = await prisma.configuracion.findUnique({
          where: { clave: "TASA_USD_COP" },
        });
        tasaDolar = parseFloat(tasaConfig?.valor || "4000");
        console.log(`💱 Tasa de cambio al completar orden: $${tasaDolar}`);
      } catch (error) {
        console.error("Error obteniendo tasa:", error);
      }

      // Registrar productos WAYRA en contabilidad
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

        for (const detalle of productosWayra) {
          let precioCompraContable = detalle.producto.precioCompra;

          if (
            detalle.producto.tipo === "WAYRA_CALAN" &&
            detalle.producto.monedaCompra === "USD" &&
            detalle.producto.precioCompra < 1000
          ) {
            precioCompraContable = detalle.producto.precioCompra * tasaDolar;
          }

          const subtotalCompra = precioCompraContable * detalle.cantidad;
          const utilidadReal = detalle.subtotal - subtotalCompra;

          await prisma.detalleIngresoContable.create({
            data: {
              movimientoContableId: movWayra.id,
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              precioCompra: precioCompraContable,
              precioVenta: detalle.precioUnitario,
              subtotalCompra: subtotalCompra,
              subtotalVenta: detalle.subtotal,
              utilidad: utilidadReal,
            },
          });
        }
      }

      // Registrar productos TORNI en contabilidad
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

      console.log(
        "✅ Contabilidad registrada correctamente al completar orden"
      );
    }

    console.log("✅ Orden actualizada exitosamente");
    return NextResponse.json(orden);
  } catch (error) {
    console.error("❌ Error updating orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verificar que la orden esté cancelada
    const orden = await prisma.ordenServicio.findUnique({
      where: { id },
    });

    if (!orden) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    if (orden.estado !== "CANCELADO") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar órdenes canceladas" },
        { status: 403 }
      );
    }

    await prisma.ordenServicio.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
