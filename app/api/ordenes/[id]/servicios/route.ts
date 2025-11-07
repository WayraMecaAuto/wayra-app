import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(
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

    const { id: ordenId } = await params;
    const body = await request.json();
    const { descripcion, precio, productosLubricacion, precioServicioTotal } = body;

    if (!descripcion || !precio) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    console.log("🔧 Procesando servicio de lubricación...");
    console.log("   - Descripción:", descripcion);
    console.log("   - Precio Total Servicio (Cliente):", precioServicioTotal || precio);
    console.log("   - Productos:", productosLubricacion?.length || 0);

    //  Obtener tasa de cambio
    let tasaDolar = 4000;
    try {
      const tasaConfig = await prisma.configuracion.findUnique({
        where: { clave: "TASA_USD_COP" },
      });
      tasaDolar = parseFloat(tasaConfig?.valor || "4000");
      console.log(`💱 Tasa de cambio: $${tasaDolar}`);
    } catch (error) {
      console.error("Error obteniendo tasa:", error);
    }

    //  PROCESAR PRODUCTOS DE LUBRICACIÓN
    let costoTotalProductosMinorista = 0;
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();

    if (
      productosLubricacion &&
      Array.isArray(productosLubricacion) &&
      productosLubricacion.length > 0
    ) {
      console.log(
        `🔧 Procesando ${productosLubricacion.length} productos de lubricación`
      );

      for (const prod of productosLubricacion) {
        const producto = await prisma.producto.findUnique({
          where: { id: prod.id },
        });

        if (!producto) {
          console.error(`❌ Producto ${prod.id} no encontrado`);
          continue;
        }

        // Verificar stock
        if (producto.stock < 1) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${producto.nombre}`,
            },
            { status: 400 }
          );
        }

        //  Calcular precio de compra EN COP (SOLO SI ES CALAN EN USD)
        let precioCompraCOP = producto.precioCompra;
        
        if (
          producto.tipo === "WAYRA_CALAN" &&
          producto.monedaCompra === "USD" &&
          producto.precioCompra < 1000
        ) {
          precioCompraCOP = producto.precioCompra * tasaDolar;
          console.log(
            `💱 Convirtiendo CALAN ${producto.nombre}: $${producto.precioCompra} USD → $${precioCompraCOP.toFixed(2)} COP`
          );
        } else {
          console.log(
            `✅ ${producto.nombre} precio compra: $${precioCompraCOP.toFixed(2)} COP (${producto.monedaCompra})`
          );
        }

        //  Acumular costo minorista para calcular utilidad del servicio
        costoTotalProductosMinorista += producto.precioMinorista;

        // Determinar entidad contable
        let entidadContable = "TORNIREPUESTOS";
        if (producto.tipo === "WAYRA_ENI" || producto.tipo === "WAYRA_CALAN") {
          entidadContable = "WAYRA_PRODUCTOS";
        }

        // 1. Actualizar stock (DESCONTAR INVENTARIO)
        await prisma.producto.update({
          where: { id: prod.id },
          data: {
            stock: {
              decrement: 1,
            },
          },
        });

        //  2. Crear movimiento de inventario
        await prisma.movimientoInventario.create({
          data: {
            tipo: "SALIDA",
            cantidad: 1,
            motivo: `Servicio de lubricación - Orden ${ordenId}`,
            precioUnitario: producto.precioMinorista,
            total: producto.precioMinorista,
            productoId: prod.id,
            usuarioId: session.user.id,
          },
        });

        console.log(`✅ ${producto.nombre}: -1 stock (movimiento registrado)`);

        //  3. Registrar INGRESO en contabilidad (VENTA A WAYRA TALLER CON PRECIO MINORISTA)
        const movimientoContable = await prisma.movimientoContable.create({
          data: {
            tipo: "INGRESO",
            concepto: "VENTA_DESDE_ORDEN",
            monto: producto.precioMinorista,
            fecha: ahora,
            descripcion: `Venta a Wayra Taller - ${producto.nombre} (Lubricación) - Orden ${ordenId}`,
            entidad: entidadContable,
            referencia: ordenId,
            mes,
            anio,
            usuarioId: session.user.id,
          },
        });

        //  4. Crear detalle contable con precio EN COP
        const utilidadProducto = producto.precioMinorista - precioCompraCOP;

        await prisma.detalleIngresoContable.create({
          data: {
            movimientoContableId: movimientoContable.id,
            productoId: prod.id,
            cantidad: 1,
            precioCompra: precioCompraCOP,
            precioVenta: producto.precioMinorista,
            subtotalCompra: precioCompraCOP,
            subtotalVenta: producto.precioMinorista,
            utilidad: utilidadProducto,
          },
        });

        console.log(`✅ Contabilidad registrada en ${entidadContable}`);
        console.log(
          `   💰 Precio Compra (COP): $${precioCompraCOP.toFixed(2)}`
        );
        console.log(`   💰 Precio Minorista (Venta a Taller): $${producto.precioMinorista}`);
        console.log(
          `   💰 Utilidad ${entidadContable}: $${utilidadProducto.toFixed(2)}`
        );
      }
    }

    //  5. Crear servicio de lubricación con el PRECIO TOTAL que cobra al cliente
    const precioServicio = precioServicioTotal || parseFloat(precio);
    const utilidadServicioWayraTaller = precioServicio - costoTotalProductosMinorista;

    console.log(`\n RESUMEN FINANCIERO:`);
    console.log(`   Precio cobrado al cliente: $${precioServicio.toLocaleString()}`);
    console.log(`   Costo productos (Minorista): $${costoTotalProductosMinorista.toLocaleString()}`);
    console.log(`   Utilidad Wayra Taller: $${utilidadServicioWayraTaller.toLocaleString()}`);

    const servicio = await prisma.servicioOrden.create({
      data: {
        descripcion: "Lubricación",
        precio: precioServicio,
        aplicaIva: false,
        ordenId,
      },
    });

    //  6. Actualizar totales de la orden
    const servicios = await prisma.servicioOrden.findMany({
      where: { ordenId },
    });

    const subtotalServicios = servicios.reduce((sum, s) => sum + s.precio, 0);

    const detalles = await prisma.detalleOrden.findMany({
      where: { ordenId },
    });
    const repuestos = await prisma.repuestoExterno.findMany({
      where: { ordenId },
    });

    const subtotalProductos = detalles.reduce((sum, d) => sum + d.subtotal, 0);
    const subtotalRepuestos = repuestos.reduce((sum, r) => sum + r.subtotal, 0);

    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId },
    });

    const total =
      subtotalServicios +
      subtotalProductos +
      subtotalRepuestos +
      (orden?.manoDeObra || 0);

    // 7. Actualizar utilidad de la orden (agregar utilidad del servicio de lubricación)
    await prisma.ordenServicio.update({
      where: { id: ordenId },
      data: {
        subtotalServicios,
        total,
        utilidad: {
          increment: utilidadServicioWayraTaller,
        },
      },
    });

    console.log("✅ Servicio de lubricación completado");
    console.log(`   💰 Precio Servicio (Cliente): $${precioServicio}`);
    console.log(
      `   💰 Costo Productos Minorista: $${costoTotalProductosMinorista.toFixed(2)}`
    );
    console.log(
      `   💰 Utilidad Wayra Taller: $${utilidadServicioWayraTaller.toFixed(2)}`
    );

    return NextResponse.json(servicio, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}