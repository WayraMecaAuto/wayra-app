import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔹 1. Obtener la factura con todas las relaciones
    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
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
      return new Response(JSON.stringify({ error: "Factura no encontrada" }), {
        status: 404,
      });
    }

    // 🔹 2. Convertir el logo a base64
    const logoPath = path.join(process.cwd(), "public", "images", "WayraLogo.png");
    const logoBase64 = fs.existsSync(logoPath)
      ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
      : "";

    // 🔹 3. Formatear fechas
    const fecha = format(new Date(factura.fecha), "PPP", { locale: es });
    const vencimiento = factura.vencimiento
      ? format(new Date(factura.vencimiento), "PPP", { locale: es })
      : "";

    // 🔹 4. Generar HTML con TODO igual que page.tsx
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Factura ${factura.numeroFactura}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gray-50 text-gray-800">
  <div class="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6">

    <!-- Encabezado -->
    <div class="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
      <div class="flex items-start space-x-3">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="Wayra Logo" class="w-16 h-16 object-contain">`
            : "<div class='w-16 h-16 bg-gray-200'></div>"
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
        <h2 class="text-3xl font-bold text-blue-600">Factura ${factura.numeroFactura}</h2>
        <p class="text-sm text-gray-600">Fecha: ${fecha}</p>
        ${vencimiento ? `<p class="text-sm text-gray-600">Vencimiento: ${vencimiento}</p>` : ""}
        <p class="text-sm text-gray-600">Orden: ${factura.orden.numeroOrden}</p>
      </div>
    </div>

    <!-- Cliente y Vehículo -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">Información del Cliente</h3>
        <p><strong>Nombre:</strong> ${factura.cliente.nombre}</p>
        <p><strong>Documento:</strong> ${factura.cliente.numeroDocumento}</p>
        ${factura.cliente.telefono ? `<p><strong>Teléfono:</strong> ${factura.cliente.telefono}</p>` : ""}
        ${factura.cliente.email ? `<p><strong>Email:</strong> ${factura.cliente.email}</p>` : ""}
        ${factura.cliente.direccion ? `<p><strong>Dirección:</strong> ${factura.cliente.direccion}</p>` : ""}
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">Información del Vehículo</h3>
        <p><strong>Placa:</strong> ${factura.orden.vehiculo.placa}</p>
        <p><strong>Marca:</strong> ${factura.orden.vehiculo.marca}</p>
        <p><strong>Modelo:</strong> ${factura.orden.vehiculo.modelo}</p>
        ${factura.orden.vehiculo.anio ? `<p><strong>Año:</strong> ${factura.orden.vehiculo.anio}</p>` : ""}
      </div>
    </div>

    <!-- Servicios -->
    ${
      factura.orden.servicios.length > 0 || factura.orden.manoDeObra > 0
        ? `
    <h3 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">Servicios Realizados</h3>
    <table class="w-full text-sm mb-6">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-2">Descripción</th>
          <th class="text-right p-2">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${factura.orden.servicios
          .map(
            (s) => `
          <tr class="border-b border-gray-200">
            <td class="p-2">${s.descripcion}</td>
            <td class="p-2 text-right">$${s.precio.toLocaleString()}</td>
          </tr>`
          )
          .join("")}
        ${
          factura.orden.manoDeObra > 0
            ? `<tr class="border-b border-gray-200"><td class="p-2 font-medium text-gray-700">Mano de Obra</td><td class="p-2 text-right font-medium">$${factura.orden.manoDeObra.toLocaleString()}</td></tr>`
            : ""
        }
      </tbody>
    </table>`
        : ""
    }

    <!-- Productos del Inventario -->
    ${
      factura.orden.detalles.length > 0
        ? `
    <h3 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">Productos Utilizados</h3>
    <table class="w-full text-sm mb-6">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-2">Código</th>
          <th class="text-left p-2">Descripción</th>
          <th class="text-center p-2">Cant.</th>
          <th class="text-right p-2">Precio Unit.</th>
          <th class="text-right p-2">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${factura.orden.detalles
          .map(
            (d) => `
          <tr class="border-b border-gray-200">
            <td class="p-2">${d.producto.codigo}</td>
            <td class="p-2">${d.producto.nombre}${d.producto.aplicaIva ? '<span class="text-xs text-blue-600"> (+IVA)</span>' : ""}</td>
            <td class="p-2 text-center">${d.cantidad}</td>
            <td class="p-2 text-right">$${d.precioUnitario.toLocaleString()}</td>
            <td class="p-2 text-right font-medium">$${d.subtotal.toLocaleString()}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`
        : ""
    }

    <!-- Repuestos Externos -->
    ${
      factura.orden.repuestosExternos.length > 0
        ? `
    <h3 class="text-sm font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2">Repuestos Externos</h3>
    <table class="w-full text-sm mb-6">
      <thead class="bg-gray-50">
        <tr>
          <th class="text-left p-2">Descripción</th>
          <th class="text-center p-2">Cant.</th>
          <th class="text-right p-2">Precio Unit.</th>
          <th class="text-right p-2">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${factura.orden.repuestosExternos
          .map(
            (r) => `
          <tr class="border-b border-gray-200">
            <td class="p-2">${r.nombre}${r.descripcion ? `<div class='text-xs text-gray-500 mt-1'>${r.descripcion}</div>` : ""}</td>
            <td class="p-2 text-center">${r.cantidad}</td>
            <td class="p-2 text-right">$${r.precioUnitario.toLocaleString()}</td>
            <td class="p-2 text-right font-medium">$${r.subtotal.toLocaleString()}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`
        : ""
    }

    <!-- Totales -->
    <div class="flex justify-end mt-6">
      <div class="bg-gray-50 rounded-lg p-4 w-64 space-y-2">
        <div class="flex justify-between border-b pb-2">
          <span>Subtotal:</span>
          <span class="font-medium">$${factura.subtotal.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b pb-2">
          <span>IVA (19%)</span>
        </div>
        <div class="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total:</span>
          <span class="text-blue-600">$${factura.total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    ${
      factura.observaciones
        ? `<div class="mt-6 p-4 bg-gray-50 rounded-lg"><h3 class="text-sm font-bold text-gray-700 mb-2">Observaciones</h3><p class="text-sm text-gray-600 whitespace-pre-wrap">${factura.observaciones}</p></div>`
        : ""
    }

    <div class="text-center text-sm text-gray-600 mt-8 pt-4 border-t">
      <p>Gracias por confiar en Wayra Mecánica Automotriz</p>
      <p>Para cualquier consulta, contáctenos al 317 606 7449</p>
    </div>
  </div>
</body>
</html>`;

    // 🔹 5. Generar el PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    // 🔹 6. Nombre de archivo dinámico
    const mes = new Date(factura.fecha).getMonth() + 1;
    const nombreArchivo = `FAC-${factura.numeroFactura}_ORD-${factura.orden.numeroOrden}_MES-${mes}.pdf`;

    // 🔹 7. Retornar el PDF
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    return new Response(JSON.stringify({ error: "Error generando PDF" }), {
      status: 500,
    });
  }
}
