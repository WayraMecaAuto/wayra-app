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
    console.log('📥 [API] Recibiendo datos para crear producto:', body);
    
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
      console.error('❌ [API] Campos requeridos faltantes:', {
        codigo: !!codigo,
        nombre: !!nombre,
        tipo: !!tipo,
        categoria: !!categoria,
        precioCompra: !!precioCompra
      });
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
      console.error('❌ [API] Precio de compra inválido:', precioCompra);
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
      console.error('❌ [API] Código duplicado:', { codigo, codigoBarras });
      return NextResponse.json(
        { error: "El código o código de barras ya existe" },
        { status: 400 }
      );
    }

    // ==================== VALIDACIÓN FLEXIBLE DE CÓDIGO DE BARRAS ====================
    let finalCodigoBarras = codigoBarras;
    
    if (!finalCodigoBarras && tipo !== "TORNILLERIA") {
      // Solo generar automáticamente si no se proporciona ningún código
      finalCodigoBarras = generateEAN13();
      console.log('🔢 [API] Código de barras generado automáticamente:', finalCodigoBarras);
    } else if (finalCodigoBarras) {
      // Si se proporciona un código, aceptarlo con validaciones mínimas
      console.log('✅ [API] Código de barras proporcionado:', finalCodigoBarras, `(${finalCodigoBarras.length} caracteres)`);
      
      // Validación 1: Longitud razonable (entre 8 y 20 caracteres)
      if (finalCodigoBarras.length < 8 || finalCodigoBarras.length > 20) {
        console.warn('⚠️ [API] Código de barras fuera del rango común:', finalCodigoBarras);
        return NextResponse.json(
          { error: `Código de barras debe tener entre 8 y 20 caracteres (actual: ${finalCodigoBarras.length})` },
          { status: 400 }
        );
      }
      
      // Validación 2: Solo números (comentar estas líneas si quieres permitir alfanuméricos)
      if (!/^\d+$/.test(finalCodigoBarras)) {
        console.warn('⚠️ [API] Código de barras contiene caracteres no numéricos:', finalCodigoBarras);
        return NextResponse.json(
          { error: "Código de barras debe contener solo números" },
          { status: 400 }
        );
      }
      
      // Info: Validación opcional de formatos estándar (solo informativa)
      if (finalCodigoBarras.length === 13) {
        const isValidEAN13 = validateEAN13(finalCodigoBarras);
        if (!isValidEAN13) {
          console.warn('ℹ️ [API] Código de 13 dígitos no pasa validación EAN-13, pero se acepta:', finalCodigoBarras);
        } else {
          console.log('✓ [API] Código de barras EAN-13 válido:', finalCodigoBarras);
        }
      } else if (finalCodigoBarras.length === 12) {
        console.log('ℹ️ [API] Código de 12 dígitos (UPC-A) aceptado:', finalCodigoBarras);
      } else if (finalCodigoBarras.length === 8) {
        console.log('ℹ️ [API] Código de 8 dígitos (EAN-8) aceptado:', finalCodigoBarras);
      } else {
        console.log('ℹ️ [API] Código de barras no estándar aceptado:', finalCodigoBarras);
      }
    }
    // ==================== FIN VALIDACIÓN DE CÓDIGO DE BARRAS ====================

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

    console.log('💰 [API] Precios calculados:', precios);

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

    console.log('✅ [API] Producto creado exitosamente:', producto.id);

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
      console.log('📦 [API] Movimiento inicial creado:', stockInicialNum, 'unidades');
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

    console.log('📝 [API] Auditoría registrada');

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("💥 [API] Error creating producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}