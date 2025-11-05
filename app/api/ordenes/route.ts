import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER", 'MECANICO'].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const anio = searchParams.get("año");
    const estado = searchParams.get("estado");

    let where: any = {};

    if (mes && anio) {
      where.mes = parseInt(mes);
      where.anio = parseInt(anio);
    }

    if (estado) {
      where.estado = estado;
    }

    const ordenes = await prisma.ordenServicio.findMany({
      where,
      include: {
        cliente: {
          select: { nombre: true, telefono: true, numeroDocumento: true },
        },
        vehiculo: {
          select: { placa: true, marca: true, modelo: true, anio: true },
        },
        mecanico: {
          select: { name: true },
        },
        servicios: true,
        detalles: {
          include: {
            producto: {
              select: { nombre: true, codigo: true },
            },
          },
        },
        repuestosExternos: true,
      },
      orderBy: { fechaCreacion: "desc" },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error fetching ordenes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
      session?.user?.role || ""
    );
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clienteId,
      vehiculoId,
      descripcion,
      mecanicoId,
      manoDeObra,
      servicios,
      productos,
      repuestosExternos,
    } = body;

    // Validaciones
    if (!clienteId || !vehiculoId || !descripcion || !mecanicoId) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Generar número de orden
    const currentDate = new Date();
    const anio = currentDate.getFullYear();
    const mes = currentDate.getMonth() + 1;

    const lastOrder = await prisma.ordenServicio.findFirst({
      where: { anio, mes },
      orderBy: { fechaCreacion: "desc" },
    });

    const orderNumber = lastOrder
      ? parseInt(lastOrder.numeroOrden.split("-")[3]) + 1
      : 1;

    const numeroOrden = `ORD-${anio}-${mes.toString().padStart(2, "0")}-${orderNumber.toString().padStart(3, "0")}`;

    // 🔥 Obtener tasa de cambio para CALAN
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

    // Calcular totales
    let subtotalServicios = 0;
    let subtotalProductos = 0;
    let subtotalRepuestosExternos = 0;

    if (servicios?.length > 0) {
      subtotalServicios = servicios.reduce(
        (sum: number, s: any) => sum + parseFloat(s.precio),
        0
      );
    }

    if (productos?.length > 0) {
      subtotalProductos = productos.reduce(
        (sum: number, p: any) =>
          sum + parseFloat(p.precio) * parseInt(p.cantidad),
        0
      );
    }

    if (repuestosExternos?.length > 0) {
      subtotalRepuestosExternos = repuestosExternos.reduce(
        (sum: number, r: any) => sum + parseFloat(r.subtotal),
        0
      );
    }

    const subtotal =
      subtotalServicios + subtotalProductos + subtotalRepuestosExternos;
    const manoDeObraNum = parseFloat(manoDeObra) || 0;
    const total = subtotal + manoDeObraNum;

    // 🔥 Calcular utilidad con conversión CALAN
    let utilidad = 0;
    
    if (productos?.length > 0) {
      for (const prod of productos) {
        const producto = await prisma.producto.findUnique({
          where: { id: prod.id },
        });
        if (producto) {
          // ✅ CONVERTIR PRECIO DE COMPRA SI ES CALAN
          let precioCompraContable = producto.precioCompra;
          if (producto.tipo === 'WAYRA_CALAN' && producto.monedaCompra === 'USD') {
            precioCompraContable = producto.precioCompra * tasaDolar;
            console.log(`💱 CALAN ${producto.nombre}: $${producto.precioCompra} USD x ${tasaDolar} = $${precioCompraContable.toFixed(2)} COP`);
          }
          
          const costoTotal = precioCompraContable * parseInt(prod.cantidad);
          const ventaTotal = parseFloat(prod.precio) * parseInt(prod.cantidad);
          utilidad += ventaTotal - costoTotal;
        }
      }
    }

    if (repuestosExternos?.length > 0) {
      utilidad += repuestosExternos.reduce(
        (sum: number, r: any) => sum + parseFloat(r.utilidad || 0),
        0
      );
    }

    // Crear orden
    const orden = await prisma.ordenServicio.create({
      data: {
        numeroOrden,
        clienteId,
        vehiculoId,
        descripcion,
        mecanicoId,
        mes,
        anio,
        manoDeObra: manoDeObraNum,
        subtotalServicios,
        subtotalProductos,
        subtotalRepuestosExternos,
        total,
        utilidad,
      },
    });

    console.log(`✅ Orden creada: ${numeroOrden}`);

    // Crear servicios
    if (servicios?.length > 0) {
      await prisma.servicioOrden.createMany({
        data: servicios.map((s: any) => ({
          descripcion: s.descripcion,
          precio: parseFloat(s.precio),
          aplicaIva: false,
          ordenId: orden.id,
        })),
      });
      console.log(`✅ ${servicios.length} servicios agregados`);
    }

    // ✅ PROCESAR PRODUCTOS Y ACTUALIZAR INVENTARIO
    if (productos?.length > 0) {
      for (const prod of productos) {
        const producto = await prisma.producto.findUnique({
          where: { id: prod.id },
        });

        if (!producto) {
          console.error(`❌ Producto ${prod.id} no encontrado`);
          continue;
        }

        // Crear detalle de orden
        await prisma.detalleOrden.create({
          data: {
            cantidad: parseInt(prod.cantidad),
            precioUnitario: parseFloat(prod.precio),
            tipoPrecio: prod.tipoPrecio || "VENTA",
            subtotal: parseFloat(prod.precio) * parseInt(prod.cantidad),
            ordenId: orden.id,
            productoId: prod.id,
          },
        });

        // Actualizar stock
        await prisma.producto.update({
          where: { id: prod.id },
          data: {
            stock: {
              decrement: parseInt(prod.cantidad),
            },
          },
        });

        // Crear movimiento de inventario
        await prisma.movimientoInventario.create({
          data: {
            tipo: "SALIDA",
            cantidad: parseInt(prod.cantidad),
            motivo: `Orden de trabajo ${numeroOrden}`,
            precioUnitario: parseFloat(prod.precio),
            total: parseFloat(prod.precio) * parseInt(prod.cantidad),
            productoId: prod.id,
            usuarioId: session.user.id,
          },
        });

        console.log(`✅ Producto ${producto.nombre}: -${prod.cantidad} stock`);
      }
    }

    // Crear repuestos externos
    if (repuestosExternos?.length > 0) {
      await prisma.repuestoExterno.createMany({
        data: repuestosExternos.map((r: any) => ({
          nombre: r.nombre,
          descripcion: r.descripcion || "",
          cantidad: parseInt(r.cantidad),
          precioCompra: parseFloat(r.precioCompra) || 0,
          precioVenta: parseFloat(r.precioVenta) || parseFloat(r.precioUnitario) || 0,
          precioUnitario: parseFloat(r.precioVenta) || parseFloat(r.precioUnitario) || 0,
          subtotal: parseFloat(r.subtotal),
          utilidad: parseFloat(r.utilidad) || 0,
          proveedor: r.proveedor || "",
          ordenId: orden.id,
        })),
      });
      console.log(`✅ ${repuestosExternos.length} repuestos externos agregados`);
    }

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}