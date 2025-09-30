import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  {params } : { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No se ha autenticado' }, {status: 401});
    }

    const { code } = await params
    
    // Limpiar el código de caracteres especiales
    const cleanCode = code.trim().replace(/\s+/g, '')
    console.log ('Buscando por el barcode', cleanCode)

    const producto = await prisma.producto.findFirst({
      where: {
        AND: [
          {
            OR: [
              { codigoBarras: cleanCode },
              { codigo: cleanCode },
              //Tambien buscar con el codigo 
              { codigoBarras: code},
              { codigo: code}
            ]
          },
          { isActive: true }
        ]
      },
      // Incluir mas información del producto
      select: {
        id: true,
        nombre: true,
        codigo: true,
        codigoBarras: true,
        descripcion: true,
        tipo: true,
        categoria: true,
        precioCompra: true,
        precioVenta: true,
        precioMinorista: true,
        precioMayorista: true,
        stock: true,
        stockMinimo: true,
        aplicaIva: true,
        monedaCompra: true,
        isActive: true,
        createdAt: true,
      }
    })

    if (!producto) {
      console.log('No se encontro el producto con el codigo', cleanCode, 'o original:', code)
      return NextResponse.json({
        error: 'No se encontro el producto',
        searchedCode: cleanCode,
        originalCode: code
      }, {status: 404});
    }

    console.log('Producto encontrado', producto.nombre, 'con codigo', producto.codigoBarras || producto.codigo)
    return NextResponse.json(producto);

  } catch (error) {
    console.error('Error al obtener el producto por medio del barcode', error);
    return NextResponse.json({ error: 'Error interno del servidor'}, {status: 500});
  }
}