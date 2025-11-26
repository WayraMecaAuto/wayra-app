import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Configuración para Vercel
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser: any = null;

  try {
    const { id } = await params;
    console.log("🔍 [1/8] Iniciando generación de PDF para factura:", id);

    // 🔹 1. Obtener la factura
    console.log("🔍 [2/8] Consultando factura en la base de datos...");
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        orden: {
          include: {
            vehiculo: true,
            servicios: true,
            detalles: { include: { producto: true } },
            repuestosExternos: true,
          },
        },
      },
    });

    if (!factura) {
      console.error("❌ Factura no encontrada en la BD");
      return new Response(JSON.stringify({ error: "Factura no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ [2/8] Factura encontrada:", factura.numeroFactura);

    // 🔹 2. Convertir el logo a base64
    console.log("🔍 [3/8] Cargando logo...");
    const fs = require("fs");
    const path = require("path");
    let logoBase64 = "";
    
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "WayraLogo.png");
      if (fs.existsSync(logoPath)) {
        logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
        console.log("✅ [3/8] Logo cargado correctamente");
      } else {
        console.log("⚠️ [3/8] Logo no encontrado en:", logoPath);
      }
    } catch (logoError) {
      console.log("⚠️ [3/8] Error al cargar logo (continuando sin logo):", logoError);
    }

    // 🔹 3. Formatear fechas
    console.log("🔍 [4/8] Formateando fechas...");
    const fecha = format(new Date(factura.fecha), "PPP", { locale: es });
    const vencimiento = factura.vencimiento
      ? format(new Date(factura.vencimiento), "PPP", { locale: es })
      : "";
    console.log("✅ [4/8] Fechas formateadas");

    // 🔹 4. Generar HTML
    console.log("🔍 [5/8] Generando HTML...");
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Factura ${factura.numeroFactura}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  </style>
</head>
<body class="bg-gray-50 text-gray-800">
  <div class="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6">

    <!-- Encabezado -->
    <div class="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-200">
      <div class="flex items-start space-x-3">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="Wayra Logo" class="w-16 h-16 object-contain">`
            : `<div class="w-16 h-16 bg-gray-200 rounded"></div>`
        }
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Wayra</h1>
          <p class="text-blue-600 font-semibold text-sm">Mecánica Automotriz</p>
          <p class="text-gray-600 text-sm">NIT: 900123456-7</p>
          <p class="text-gray-600 text-sm">Cel: 317 606 7449</p>
          <p class="text-gray-600 text-sm">info@wayra.com</p>
        </div>
      </div>
      <div class="text-right">
        <h2 class="text-3xl font-bold text-blue-600 mb-2">${factura.numeroFactura}</h2>
        <div class="text-sm text-gray-600">
          <p><span class="font-medium">Fecha:</span> ${fecha}</p>
          ${vencimiento ? `<p><span class="font-medium">Vencimiento:</span> ${vencimiento}</p>` : ""}
          <p><span class="font-medium">Orden:</span> ${factura.orden.numeroOrden}</p>
        </div>
      </div>
    </div>

    <!-- Cliente y Vehículo -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">Información del Cliente</h3>
        <div class="text-sm space-y-1">
          <p><span class="font-medium text-gray-700">Nombre:</span> ${factura.cliente.nombre}</p>
          <p><span class="font-medium text-gray-700">Documento:</span> ${factura.cliente.numeroDocumento}</p>
          ${factura.cliente.telefono ? `<p><span class="font-medium text-gray-700">Teléfono:</span> ${factura.cliente.telefono}</p>` : ""}
          ${factura.cliente.email ? `<p><span class="font-medium text-gray-700">Email:</span> ${factura.cliente.email}</p>` : ""}
          ${factura.cliente.direccion ? `<p><span class="font-medium text-gray-700">Dirección:</span> ${factura.cliente.direccion}</p>` : ""}
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">Información del Vehículo</h3>
        <div class="text-sm space-y-1">
          <p><span class="font-medium text-gray-700">Placa:</span> ${factura.orden.vehiculo.placa}</p>
          <p><span class="font-medium text-gray-700">Marca:</span> ${factura.orden.vehiculo.marca}</p>
          <p><span class="font-medium text-gray-700">Modelo:</span> ${factura.orden.vehiculo.modelo}</p>
          ${factura.orden.vehiculo.anio ? `<p><span class="font-medium text-gray-700">Año:</span> ${factura.orden.vehiculo.anio}</p>` : ""}
        </div>
      </div>
    </div>

    <!-- Servicios -->
    ${
      factura.orden.servicios.length > 0 || factura.orden.manoDeObra > 0
        ? `
    <div class="mb-6">
      <h3 class="text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">Servicios Realizados</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-3 font-semibold text-gray-700">Descripción</th>
            <th class="text-right p-3 font-semibold text-gray-700">Precio</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${factura.orden.servicios
            .map(
              (s) => `
            <tr>
              <td class="p-3">${s.descripcion}</td>
              <td class="p-3 text-right font-medium">$${s.precio.toLocaleString()}</td>
            </tr>`
            )
            .join("")}
          ${
            factura.orden.manoDeObra > 0
              ? `<tr><td class="p-3 font-medium text-gray-700">Mano de Obra</td><td class="p-3 text-right font-medium">$${factura.orden.manoDeObra.toLocaleString()}</td></tr>`
              : ""
          }
        </tbody>
      </table>
    </div>`
        : ""
    }

    <!-- Productos del Inventario -->
    ${
      factura.orden.detalles.length > 0
        ? `
    <div class="mb-6">
      <h3 class="text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">Productos Utilizados</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-3 font-semibold text-gray-700">Código</th>
            <th class="text-left p-3 font-semibold text-gray-700">Descripción</th>
            <th class="text-center p-3 font-semibold text-gray-700">Cant.</th>
            <th class="text-right p-3 font-semibold text-gray-700">Precio Unit.</th>
            <th class="text-right p-3 font-semibold text-gray-700">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${factura.orden.detalles
            .map(
              (d) => `
            <tr>
              <td class="p-3 text-xs">${d.producto.codigo}</td>
              <td class="p-3">${d.producto.nombre}${d.producto.aplicaIva ? '<span class="text-xs text-blue-600"> (+IVA)</span>' : ""}</td>
              <td class="p-3 text-center">${d.cantidad}</td>
              <td class="p-3 text-right">$${d.precioUnitario.toLocaleString()}</td>
              <td class="p-3 text-right font-medium">$${d.subtotal.toLocaleString()}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
        : ""
    }

    <!-- Repuestos Externos -->
    ${
      factura.orden.repuestosExternos.length > 0
        ? `
    <div class="mb-6">
      <h3 class="text-xs font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">Repuestos Externos</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-3 font-semibold text-gray-700">Descripción</th>
            <th class="text-center p-3 font-semibold text-gray-700">Cant.</th>
            <th class="text-right p-3 font-semibold text-gray-700">Precio Unit.</th>
            <th class="text-right p-3 font-semibold text-gray-700">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${factura.orden.repuestosExternos
            .map(
              (r) => `
            <tr>
              <td class="p-3">
                ${r.nombre}
                ${r.descripcion ? `<div class="text-xs text-gray-500 mt-1">${r.descripcion}</div>` : ""}
              </td>
              <td class="p-3 text-center">${r.cantidad}</td>
              <td class="p-3 text-right">$${r.precioUnitario.toLocaleString()}</td>
              <td class="p-3 text-right font-medium">$${r.subtotal.toLocaleString()}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
        : ""
    }

    <!-- Totales -->
    <div class="flex justify-end mt-8">
      <div class="w-80 bg-gray-50 rounded-lg p-4 space-y-3">
        <div class="flex justify-between text-sm pb-2 border-b border-gray-200">
          <span class="text-gray-600">Subtotal:</span>
          <span class="font-medium">$${factura.subtotal.toLocaleString()}</span>
        </div>
        <div class="flex justify-between text-sm pb-2 border-b border-gray-200">
          <span class="text-gray-600">IVA (19%):</span>
          <span class="font-medium">$${factura.iva.toLocaleString()}</span>
        </div>
        <div class="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
          <span class="text-gray-900">Total:</span>
          <span class="text-blue-600">$${factura.total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    ${
      factura.observaciones
        ? `
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-sm font-bold text-gray-700 uppercase mb-2">Observaciones</h3>
      <p class="text-sm text-gray-600 whitespace-pre-wrap">${factura.observaciones}</p>
    </div>`
        : ""
    }

    <!-- Footer -->
    <div class="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
      <p>Gracias por confiar en Wayra Mecánica Automotriz</p>
      <p class="mt-1">Para cualquier consulta, contáctenos al 317 606 7449</p>
    </div>
  </div>
</body>
</html>`;

    console.log("✅ [5/8] HTML generado");

    // 🔹 5. Detectar entorno y lanzar navegador apropiado
    console.log("🚀 [6/8] Iniciando generación del PDF...");
    
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // PRODUCCIÓN (Vercel): Usar puppeteer-core + @sparticuz/chromium
      console.log("🔧 Entorno: PRODUCCIÓN (Vercel)");
      const puppeteerCore = require("puppeteer-core");
      const chromium = require("@sparticuz/chromium");
      
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      // DESARROLLO LOCAL: Usar puppeteer normal
      console.log("🔧 Entorno: DESARROLLO LOCAL");
      const puppeteer = require("puppeteer");
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    console.log("✅ [6/8] Navegador lanzado");

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("✅ [7/8] Contenido cargado en la página");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    console.log("✅ [7/8] PDF generado exitosamente");

    await browser.close();
    console.log("✅ Navegador cerrado");

    // 🔹 6. Nombre de archivo
    const mes = new Date(factura.fecha).getMonth() + 1;
    const nombreArchivo = `FAC-${factura.numeroFactura}_ORD-${factura.orden.numeroOrden}_MES-${mes}.pdf`;

    console.log("✅ [8/8] Proceso completado. Enviando PDF:", nombreArchivo);

    // 🔹 7. Retornar el PDF
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (err) {
    console.error("❌❌❌ ERROR FATAL ❌❌❌");
    console.error("Mensaje:", err instanceof Error ? err.message : "Error desconocido");
    console.error("Stack:", err instanceof Error ? err.stack : "No stack");
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error cerrando navegador:", closeError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Error generando PDF",
        details: err instanceof Error ? err.message : "Error desconocido",
        stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}