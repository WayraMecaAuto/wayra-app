import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { calculatePrices } from "@/lib/pricing";
import { generateEAN13, validateEAN13 } from "@/lib/barcode";
import {
  registrarAuditoria,
  auditarEdicion,
  auditarEliminacion,
  obtenerInfoRequest,
} from "@/lib/auditoria";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipoParam = searchParams.get("tipo");
    const categoria = searchParams.get("categoria");
    const search = searchParams.get("search");

    let where: any = { isActive: true };

    // Manejar múltiples tipos separados por coma
    if (tipoParam) {
      const tipos = tipoParam.split(",").map((t) => t.trim());
      if (tipos.length > 1) {
        where.tipo = { in: tipos };
      } else {
        where.tipo = tipos[0];
      }
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { codigo: { contains: search, mode: "insensitive" } },
        { codigoBarras: { contains: search, mode: "insensitive" } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        movimientos: {
          take: 5,
          orderBy: { fecha: "desc" },
          include: {
            usuario: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar permisos para crear productos
    const canCreate = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_PRODUCTOS",
      "ADMIN_TORNI_REPUESTOS",
    ].includes(session?.user?.role || "");

    if (!session || !canCreate) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      codigo,
      codigoBarras,
      nombre,
      descripcion,
      tipo,
      categoria,
      precioCompra,
      monedaCompra,
      aplicaIva,
      porcentajeGanancia,
      stockMinimo,
      stockInicial,
    } = body;

    // Validaciones
    if (!codigo || !nombre || !tipo || !categoria || !precioCompra) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // Convertir a números
    const precioCompraNum = parseFloat(precioCompra);
    const stockInicialNum = parseInt(stockInicial) || 0;
    const stockMinimoNum = parseInt(stockMinimo) || 5;

    if (isNaN(precioCompraNum) || precioCompraNum <= 0) {
      return NextResponse.json(
        { error: "Precio de compra inválido" },
        { status: 400 }
      );
    }

    // Verificar código único
    const existingProduct = await prisma.producto.findFirst({
      where: {
        OR: [{ codigo }, ...(codigoBarras ? [{ codigoBarras }] : [])],
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "El código o código de barras ya existe" },
        { status: 400 }
      );
    }

    // Generar código de barras si no se proporciona (excepto para tornillería)
    let finalCodigoBarras = codigoBarras;
    if (!finalCodigoBarras && tipo !== "TORNILLERIA") {
      finalCodigoBarras = generateEAN13();
    } else if (finalCodigoBarras && !validateEAN13(finalCodigoBarras)) {
      return NextResponse.json(
        { error: "Código de barras inválido" },
        { status: 400 }
      );
    }

    // Obtener tasa de cambio
    const tasaConfig = await prisma.configuracion.findUnique({
      where: { clave: "TASA_USD_COP" },
    });
    const tasaUSD = parseFloat(tasaConfig?.valor || "4000");

    // Calcular precios
    const precios = calculatePrices(
      precioCompraNum,
      tipo,
      categoria,
      aplicaIva || false,
      tasaUSD
    );

    // Crear producto
    const producto = await prisma.producto.create({
      data: {
        codigo,
        codigoBarras: finalCodigoBarras,
        nombre,
        descripcion: descripcion || null,
        tipo,
        categoria,
        precioCompra: precioCompraNum,
        monedaCompra: monedaCompra || "COP",
        precioVenta: precios.precioVenta,
        precioMinorista: precios.precioMinorista,
        precioMayorista: precios.precioMayorista,
        aplicaIva: precios.config.ivaObligatorio || aplicaIva || false,
        porcentajeGanancia: porcentajeGanancia || precios.config.margenGanancia,
        stock: stockInicialNum,
        stockMinimo: stockMinimoNum,
      },
    });

    // Crear movimiento inicial si hay stock
    if (stockInicialNum > 0) {
      await prisma.movimientoInventario.create({
        data: {
          tipo: "ENTRADA",
          cantidad: stockInicialNum,
          motivo: "Stock inicial",
          precioUnitario: precioCompraNum,
          total: precioCompraNum * stockInicialNum,
          productoId: producto.id,
          usuarioId: session.user.id,
        },
      });
    }

    const { ip, userAgent } = obtenerInfoRequest(request);

    await registrarAuditoria({
      accion: "CREAR",
      entidad: "Producto",
      entidadId: producto.id,
      descripcion: `Creó producto ${producto.nombre} (${producto.tipo})`,
      datosNuevos: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        tipo: producto.tipo,
        categoria: producto.categoria,
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta,
        stock: producto.stock,
      },
      usuarioId: session.user.id,
      ip,
      userAgent,
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error creating producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
