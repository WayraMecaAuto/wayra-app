import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const ROLES_ENTRADA = [
  "SUPER_USUARIO",
  "ADMIN_WAYRA_TALLER",
  "ADMIN_WAYRA_PRODUCTOS",
  "ADMIN_TORNI_REPUESTOS",
];
const ROLES_SALIDA = [
  "SUPER_USUARIO",
  "ADMIN_WAYRA_TALLER",
  "ADMIN_WAYRA_PRODUCTOS",
  "ADMIN_TORNI_REPUESTOS",
  "VENDEDOR_WAYRA",
  "VENDEDOR_TORNI",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      take: 50,
      orderBy: { fecha: "desc" },
      include: {
        producto: {
          select: { nombre: true, codigo: true },
        },
        usuario: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(movimientos);
  } catch (error) {
    console.error("Error fetching movimientos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      productoId,
      tipo,
      cantidad,
      motivo,
      precioUnitario,
      precioCompraCop,
    } = body;
    const userRole = session.user.role;

    // Validaciones
    if (!productoId || !tipo || !cantidad) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    if (tipo === "ENTRADA" && !ROLES_ENTRADA.includes(userRole)) {
      return NextResponse.json(
        {
          error: "No tienes permisos para registrar entradas de inventario.",
        },
        { status: 403 }
      );
    }

    if (tipo === "SALIDA" && !ROLES_SALIDA.includes(userRole)) {
      return NextResponse.json(
        {
          error: "No tienes permisos para registrar salidas de inventario.",
        },
        { status: 403 }
      );
    }

    const cantidadNum = parseInt(cantidad.toString());
    const precioUnitarioNum =
      precioUnitario && precioUnitario !== ""
        ? parseFloat(precioUnitario.toString())
        : null;

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    // Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Validar stock para salidas
    if (tipo === "SALIDA" && producto.stock < cantidadNum) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Disponible: ${producto.stock}, solicitado: ${cantidadNum}`,
        },
        { status: 400 }
      );
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stock;
    if (tipo === "ENTRADA") {
      nuevoStock += cantidadNum;
    } else if (tipo === "SALIDA") {
      nuevoStock -= cantidadNum;
    }

    // Determinar entidad contable según tipo de producto
    let entidadContable = "TORNIREPUESTOS";
    if (producto.tipo === "WAYRA_ENI" || producto.tipo === "WAYRA_CALAN") {
      entidadContable = "WAYRA_PRODUCTOS";
    }

    // Crear movimiento, actualizar stock y registrar en contabilidad
    const movimiento = await prisma.$transaction(async (tx) => {
      // 1. Crear movimiento de inventario
      const nuevoMovimiento = await tx.movimientoInventario.create({
        data: {
          tipo,
          cantidad: cantidadNum,
          motivo: motivo || "Sin motivo especificado",
          precioUnitario: precioUnitarioNum,
          total: precioUnitarioNum ? precioUnitarioNum * cantidadNum : null,
          productoId,
          usuarioId: session.user.id,
        },
        include: {
          producto: {
            select: { nombre: true, codigo: true },
          },
          usuario: {
            select: { name: true },
          },
        },
      });

      // 2. Actualizar stock
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: nuevoStock },
      });

      // 3. Si es SALIDA (venta directa), registrar en contabilidad
      if (tipo === "SALIDA" && precioUnitarioNum) {
        const ahora = new Date();
        const mes = ahora.getMonth() + 1;
        const anio = ahora.getFullYear();

        // 🔥 Obtener tasa de cambio para CALAN
        let tasaDolar = 4000;
        try {
          const tasaConfig = await tx.configuracion.findUnique({
            where: { clave: "TASA_USD_COP" },
          });
          tasaDolar = parseFloat(tasaConfig?.valor || "4000");
        } catch (error) {
          console.error("Error obteniendo tasa:", error);
        }

        // 🔥 Calcular precio de compra EN COP (SOLO SI ES CALAN EN USD)
        let precioCompraContable = producto.precioCompra;

        if (
          producto.tipo === "WAYRA_CALAN" &&
          producto.monedaCompra === "USD" &&
          producto.precioCompra < 1000 // Si es menor a 1000, probablemente está en USD
        ) {
          precioCompraContable = producto.precioCompra * tasaDolar;
          console.log(
            `💱 Conversión venta directa CALAN: $${producto.precioCompra} USD x ${tasaDolar} = $${precioCompraContable.toFixed(2)} COP`
          );
        } else {
          console.log(
            `✅ Precio compra: $${precioCompraContable.toFixed(2)} COP`
          );
        }

        const movimientoContable = await tx.movimientoContable.create({
          data: {
            tipo: "INGRESO",
            concepto: "VENTA_PRODUCTO",
            monto: precioUnitarioNum * cantidadNum,
            fecha: ahora,
            descripcion: `Venta directa: ${producto.nombre} - ${motivo}`,
            entidad: entidadContable,
            referencia: productoId,
            mes,
            anio,
            usuarioId: session.user.id,
          },
        });

        // Crear detalle del ingreso (usando precioCompraCop si viene del frontend, sino calcular)
        const precioCompraFinal = precioCompraCop ?? precioCompraContable;
        const subtotalCompra = precioCompraFinal * cantidadNum;
        const subtotalVenta = precioUnitarioNum * cantidadNum;
        const utilidadReal = subtotalVenta - subtotalCompra;

        await tx.detalleIngresoContable.create({
          data: {
            movimientoContableId: movimientoContable.id,
            productoId,
            cantidad: cantidadNum,
            precioCompra: precioCompraFinal, //  Precio en COP
            precioVenta: precioUnitarioNum,
            subtotalCompra: subtotalCompra,
            subtotalVenta: subtotalVenta,
            utilidad: utilidadReal, // Venta - Compra en COP
          },
        });

        console.log(`✅ Venta directa registrada en ${entidadContable}`);
        console.log(`   💰 Compra COP: $${precioCompraFinal.toFixed(2)}`);
        console.log(`   💰 Venta: $${precioUnitarioNum}`);
        console.log(`   💰 Utilidad: $${utilidadReal.toFixed(2)}`);
      }

      return nuevoMovimiento;
    });

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    console.error("Error creating movimiento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
