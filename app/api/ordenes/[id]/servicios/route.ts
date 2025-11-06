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
    const { descripcion, precio, productosLubricacion } = body;

    if (!descripcion || !precio) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    console.log("🔧 Procesando servicio de lubricación...");
    console.log("   - Descripción:", descripcion);
    console.log("   - Precio Total Servicio:", precio);
    console.log("   - Productos:", productosLubricacion?.length || 0);

    // 🔥 Obtener tasa de cambio
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

    // 🔥 PROCESAR PRODUCTOS DE LUBRICACIÓN
    let costoTotalProductos = 0;
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

        // 🔥 Calcular precio de compra EN COP (SOLO SI ES CALAN EN USD)
        let precioCompraCOP = producto.precioCompra;
        
        // ✅ SOLO convertir si es CALAN en USD Y el precio no está ya convertido
        if (
          producto.tipo === "WAYRA_CALAN" &&
          producto.monedaCompra === "USD" &&
          producto.precioCompra < 1000 // Si es menor a 1000, probablemente está en USD
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

        costoTotalProductos += precioCompraCOP;

        // Determinar entidad contable
        let entidadContable = "TORNIREPUESTOS";
        if (producto.tipo === "WAYRA_ENI" || producto.tipo === "WAYRA_CALAN") {
          entidadContable = "WAYRA_PRODUCTOS";
        }

        // 🔥 1. Actualizar stock (DESCONTAR INVENTARIO)
        await prisma.producto.update({
          where: { id: prod.id },
          data: {
            stock: {
              decrement: 1,
            },
          },
        });

        // 🔥 2. Crear movimiento de inventario
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

        // 🔥 3. Registrar INGRESO en contabilidad (VENTA A WAYRA TALLER)
        const movimientoContable = await prisma.movimientoContable.create({
          data: {
            tipo: "INGRESO",
            concepto: "VENTA_DESDE_ORDEN",
            monto: producto.precioMinorista, // 🔥 Precio MINORISTA (venta a Wayra Taller)
            fecha: ahora,
            descripcion: `Venta a Wayra Taller - ${producto.nombre} (Lubricación) - Orden ${ordenId}`,
            entidad: entidadContable,
            referencia: ordenId,
            mes,
            anio,
            usuarioId: session.user.id,
          },
        });

        // 🔥 4. Crear detalle contable con precio EN COP
        await prisma.detalleIngresoContable.create({
          data: {
            movimientoContableId: movimientoContable.id,
            productoId: prod.id,
            cantidad: 1,
            precioCompra: precioCompraCOP, // ✅ Precio YA en COP (convertido solo si era USD)
            precioVenta: producto.precioMinorista, // 🔥 Precio MINORISTA
            subtotalCompra: precioCompraCOP,
            subtotalVenta: producto.precioMinorista,
            utilidad: producto.precioMinorista - precioCompraCOP, // ✅ CORRECTO: Venta - Compra en COP
          },
        });

        console.log(`✅ Contabilidad registrada en ${entidadContable}`);
        console.log(
          `   💰 Precio Compra (COP): $${precioCompraCOP.toFixed(2)}`
        );
        console.log(`   💰 Precio Minorista (Venta a Taller): $${producto.precioMinorista}`);
        console.log(
          `   💰 Utilidad: $${(producto.precioMinorista - precioCompraCOP).toFixed(2)}`
        );
      }
    }

    // 🔥 5. Crear servicio de lubricación (SOLO el servicio, sin productos duplicados)
    const servicio = await prisma.servicioOrden.create({
      data: {
        descripcion: "Lubricación",
        precio: parseFloat(precio), // 🔥 Precio MANUAL que puso el usuario
        aplicaIva: false,
        ordenId,
      },
    });

    // 🔥 6. Actualizar totales de la orden
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

    // 7. Calcular utilidad del servicio de lubricación para WAYRA TALLER
    const utilidadLubricacion = parseFloat(precio) - costoTotalProductos;

    await prisma.ordenServicio.update({
      where: { id: ordenId },
      data: {
        subtotalServicios,
        total,
        utilidad: {
          increment: utilidadLubricacion, // Agregar utilidad de lubricación
        },
      },
    });

    console.log("✅ Servicio de lubricación completado");
    console.log(`   💰 Precio Servicio (Manual): $${precio}`);
    console.log(
      `   💰 Costo Productos (COP): $${costoTotalProductos.toFixed(2)}`
    );
    console.log(
      `   💰 Utilidad Wayra Taller: $${utilidadLubricacion.toFixed(2)}`
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