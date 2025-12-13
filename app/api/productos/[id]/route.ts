import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { calculatePrices } from "@/lib/pricing";
import { validateBarcode } from "@/lib/barcode";
import {
  registrarAuditoria,
  auditarEdicion,
  auditarEliminacion,
  obtenerInfoRequest,
} from "@/lib/auditoria";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const producto = await prisma.producto.findUnique({
      where: { id },
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

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    console.error("Error fetching producto:", error);
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
    
    // Verificar permisos para editar productos
    const canEdit = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_PRODUCTOS",
      "ADMIN_TORNI_REPUESTOS",
    ].includes(session?.user?.role || "");

    if (!session || !canEdit) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log('📥 [API] Actualizando producto:', id, body);

    // Obtener producto anterior para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { id },
    });

    if (!productoAnterior) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (body.codigoBarras !== undefined && body.codigoBarras !== productoAnterior.codigoBarras) {
      const codigoBarras = body.codigoBarras?.trim();
      
      if (codigoBarras) {
        // Validar el nuevo código de barras
        const validation = validateBarcode(codigoBarras);
        
        if (!validation.isValid) {
          console.error('❌ [API] Código de barras inválido:', validation.message);
          return NextResponse.json(
            { error: `Código de barras inválido: ${validation.message}` },
            { status: 400 }
          );
        }
        
        console.log(`✅ [API] Código de barras válido: ${validation.format} - ${validation.message}`);
        
        // Verificar que no esté duplicado
        const existingBarcode = await prisma.producto.findFirst({
          where: { 
            codigoBarras: codigoBarras,
            id: { not: id } // Excluir el producto actual
          }
        });

        if (existingBarcode) {
          console.error('❌ [API] Código de barras duplicado:', codigoBarras);
          return NextResponse.json(
            { error: "Este código de barras ya está registrado en otro producto" },
            { status: 400 }
          );
        }
        
        // Actualizar en body
        body.codigoBarras = codigoBarras;
      }
    }

    // Crear objeto de actualización limpio
    const updateData: any = {};

    // Solo incluir campos que existen en el modelo
    if (body.codigo !== undefined) updateData.codigo = body.codigo;
    if (body.codigoBarras !== undefined) updateData.codigoBarras = body.codigoBarras;
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.monedaCompra !== undefined) updateData.monedaCompra = body.monedaCompra;
    if (body.aplicaIva !== undefined) updateData.aplicaIva = body.aplicaIva;

    // Convertir strings a números donde sea necesario
    if (body.precioCompra !== undefined) {
      updateData.precioCompra = parseFloat(body.precioCompra.toString());
    }
    if (body.stockMinimo !== undefined) {
      updateData.stockMinimo = parseInt(body.stockMinimo.toString());
    }
    if (body.porcentajeGanancia !== undefined) {
      updateData.porcentajeGanancia = parseFloat(
        body.porcentajeGanancia.toString()
      );
    }

    // Si se actualiza el precio de compra, recalcular precios
    if (updateData.precioCompra) {
      const tasaConfig = await prisma.configuracion.findUnique({
        where: { clave: "TASA_USD_COP" },
      });
      const tasaUSD = parseFloat(tasaConfig?.valor || "4000");

      const precios = calculatePrices(
        updateData.precioCompra,
        productoAnterior.tipo,
        productoAnterior.categoria,
        updateData.aplicaIva ?? productoAnterior.aplicaIva,
        tasaUSD
      );

      updateData.precioVenta = precios.precioVenta;
      updateData.precioMinorista = precios.precioMinorista;
      updateData.precioMayorista = precios.precioMayorista;
      
      console.log('💰 [API] Precios recalculados:', precios);
    }

    // Actualizar producto
    const producto = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ [API] Producto actualizado exitosamente:', producto.id);

    // Registrar auditoría
    const { ip, userAgent } = obtenerInfoRequest(request);

    await auditarEdicion(
      "Producto",
      producto.id,
      {
        codigo: productoAnterior?.codigo,
        codigoBarras: productoAnterior?.codigoBarras,
        nombre: productoAnterior?.nombre,
        precioCompra: productoAnterior?.precioCompra,
        precioVenta: productoAnterior?.precioVenta,
        stock: productoAnterior?.stock,
      },
      {
        codigo: producto.codigo,
        codigoBarras: producto.codigoBarras,
        nombre: producto.nombre,
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta,
        stock: producto.stock,
      },
      session.user.id,
      ip,
      userAgent
    );

    console.log('📝 [API] Auditoría registrada');

    return NextResponse.json(producto);
  } catch (error) {
    console.error("💥 [API] Error updating producto:", error);
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

    // Verificar permisos para eliminar productos
    const canDelete = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_PRODUCTOS",
      "ADMIN_TORNI_REPUESTOS",
    ].includes(session?.user?.role || "");

    if (!session || !canDelete) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const producto = await prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete - marcar como inactivo
    await prisma.producto.update({
      where: { id },
      data: { isActive: false },
    });

    console.log('🗑️ [API] Producto eliminado (soft delete):', id);

    // Registrar auditoría
    const { ip, userAgent } = obtenerInfoRequest(request);

    await auditarEliminacion(
      "Producto",
      id,
      {
        codigo: producto?.codigo,
        codigoBarras: producto?.codigoBarras,
        nombre: producto?.nombre,
        tipo: producto?.tipo,
      },
      session.user.id,
      ip,
      userAgent
    );

    console.log('📝 [API] Auditoría de eliminación registrada');

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("💥 [API] Error deleting producto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}