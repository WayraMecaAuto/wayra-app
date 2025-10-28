import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
    if (!session || !hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener la factura
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        orden: {
          include: {
            vehiculo: true,
            servicios: true,
            detalles: {
              include: {
                producto: true
              }
            },
            repuestosExternos: true
          }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Generar HTML para el PDF
    const html = generarHTMLFactura(factura)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    })
    
    await browser.close()

    // Retornar el PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${factura.numeroFactura}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ 
      error: 'Error al generar PDF',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

function generarHTMLFactura(factura: any, logoBase64: string): string {
  const estadoBadge = {
    PENDIENTE: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
    PAGADA: { bg: '#d1fae5', text: '#065f46', label: 'Pagada' },
    VENCIDA: { bg: '#fee2e2', text: '#991b1b', label: 'Vencida' },
    ANULADA: { bg: '#f3f4f6', text: '#1f2937', label: 'Anulada' }
  }[factura.estado] || { bg: '#f3f4f6', text: '#1f2937', label: factura.estado }

  // Extraer mes y año de la fecha
  const fecha = new Date(factura.fecha)
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const mes = meses[fecha.getMonth()]
  const año = fecha.getFullYear()

  // Generar título personalizado
  const titulo = `FAC-${factura.numeroFactura.split('-')[1]}`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1f2937;
          position: relative;
        }
        /* Marca de agua con logo */
        body::before {
          content: '';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          width: 700px;
          height: 700px;
          background-image: url('${logoBase64}');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.08;
          z-index: -1;
          pointer-events: none;
        }
        .container {
          padding: 20px;
          position: relative;
          z-index: 1;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        .logo-section {
          display: flex;
          align-items: start;
          gap: 15px;
        }
        .logo {
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 2px solid #e5e7eb;
        }
        .logo img {
          width: 90px;
          height: 90px;
          object-fit: contain;
        }
        .company-info h1 {
          font-size: 22px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }
        .company-info .subtitle {
          font-size: 13px;
          color: #2563eb;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .company-info p {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 3px;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 16px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .invoice-number {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: ${estadoBadge.bg};
          color: ${estadoBadge.text};
          margin-left: 8px;
        }
        .invoice-details {
          font-size: 11px;
          color: #6b7280;
          margin-top: 8px;
        }
        .invoice-details p {
          margin-bottom: 3px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
        }
        .info-box {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #f9fafb;
        }
        .info-box h3 {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #2563eb;
        }
        .info-box p {
          font-size: 11px;
          color: #1f2937;
          margin-bottom: 5px;
        }
        .info-box strong {
          color: #374151;
        }
        .section-title {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          color: #374151;
          margin: 20px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        thead {
          background: #f3f4f6;
        }
        th {
          padding: 10px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        th.right {
          text-align: right;
        }
        th.center {
          text-align: center;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        td.right {
          text-align: right;
        }
        td.center {
          text-align: center;
        }
        .totals {
          width: 350px;
          margin-left: auto;
          margin-top: 20px;
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          border: 2px solid #e5e7eb;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
        }
        .total-row.final {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #374151;
          border-bottom: none;
          padding-top: 12px;
          margin-top: 8px;
        }
        .total-row.final .amount {
          color: #2563eb;
        }
        .observaciones {
          margin-top: 25px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        .observaciones h3 {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 8px;
        }
        .observaciones p {
          font-size: 11px;
          color: #6b7280;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        .footer p {
          margin-bottom: 5px;
        }
        .badge-iva {
          display: inline-block;
          font-size: 9px;
          color: #2563eb;
          margin-left: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo">
              <img src="${logoBase64}" alt="Wayra Logo" />
            </div>
            <div class="company-info">
              <h1>Wayra</h1>
              <p class="subtitle">Mecánica Automotriz</p>
              <p>NIT: 900123456-7</p>
              <p>Cel: 317 606 7449</p>
              <p>Email: info@wayra.com</p>
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">${titulo}</div>
            <div>
              <span class="invoice-number">${factura.numeroFactura}</span>
              <span class="status-badge">${estadoBadge.label}</span>
            </div>
            <div class="invoice-details">
              <p><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleDateString('es-CO')}</p>
              ${factura.vencimiento ? `<p><strong>Vencimiento:</strong> ${new Date(factura.vencimiento).toLocaleDateString('es-CO')}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Info Cliente y Vehículo -->
        <div class="info-grid">
          <div class="info-box">
            <h3>Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${factura.cliente.nombre}</p>
            <p><strong>Documento:</strong> ${factura.cliente.numeroDocumento}</p>
            ${factura.cliente.telefono ? `<p><strong>Teléfono:</strong> ${factura.cliente.telefono}</p>` : ''}
            ${factura.cliente.email ? `<p><strong>Email:</strong> ${factura.cliente.email}</p>` : ''}
            ${factura.cliente.direccion ? `<p><strong>Dirección:</strong> ${factura.cliente.direccion}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>Información del Vehículo</h3>
            <p><strong>Placa:</strong> ${factura.orden.vehiculo.placa}</p>
            <p><strong>Marca:</strong> ${factura.orden.vehiculo.marca}</p>
            <p><strong>Modelo:</strong> ${factura.orden.vehiculo.modelo}</p>
            ${factura.orden.vehiculo.anio ? `<p><strong>Año:</strong> ${factura.orden.vehiculo.anio}</p>` : ''}
          </div>
        </div>

        <!-- Servicios -->
        ${factura.orden.servicios.length > 0 ? `
          <h3 class="section-title">Servicios Realizados</h3>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="right">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${factura.orden.servicios.map((servicio: any) => `
                <tr>
                  <td>${servicio.descripcion}</td>
                  <td class="right">${servicio.precio.toLocaleString('es-CO')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Productos -->
        ${factura.orden.detalles.length > 0 ? `
          <h3 class="section-title">Productos Utilizados</h3>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th class="center">Cant.</th>
                <th class="right">Precio Unit.</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${factura.orden.detalles.map((detalle: any) => `
                <tr>
                  <td>${detalle.producto.codigo}</td>
                  <td>
                    ${detalle.producto.nombre}
                    ${detalle.producto.aplicaIva ? '<span class="badge-iva">(+IVA)</span>' : ''}
                  </td>
                  <td class="center">${detalle.cantidad}</td>
                  <td class="right">${detalle.precioUnitario.toLocaleString('es-CO')}</td>
                  <td class="right"><strong>${detalle.subtotal.toLocaleString('es-CO')}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Repuestos Externos -->
        ${factura.orden.repuestosExternos.length > 0 ? `
          <h3 class="section-title">Repuestos Externos</h3>
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="center">Cant.</th>
                <th class="right">Precio Unit.</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${factura.orden.repuestosExternos.map((repuesto: any) => `
                <tr>
                  <td>
                    <strong>${repuesto.nombre}</strong>
                    ${repuesto.descripcion ? `<br><span style="font-size: 10px; color: #6b7280;">${repuesto.descripcion}</span>` : ''}
                  </td>
                  <td class="center">${repuesto.cantidad}</td>
                  <td class="right">${repuesto.precioUnitario.toLocaleString('es-CO')}</td>
                  <td class="right"><strong>${repuesto.subtotal.toLocaleString('es-CO')}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Totales -->
        <div class="totals">
          ${factura.orden.manoDeObra > 0 ? `
            <div class="total-row">
              <span>Mano de Obra:</span>
              <span>${factura.orden.manoDeObra.toLocaleString('es-CO')}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${factura.subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div class="total-row">
            <span>IVA (19%)</span>
          </div>
          <div class="total-row final">
            <span>Total:</span>
            <span class="amount">${factura.total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <!-- Observaciones -->
        ${factura.observaciones ? `
          <div class="observaciones">
            <h3>Observaciones</h3>
            <p>${factura.observaciones}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Gracias por confiar en Wayra Mecánica Automotriz</strong></p>
          <p>Para cualquier consulta, contáctenos al 317 606 7449 o info@wayra.com</p>
          <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">Documento generado electrónicamente | Válido sin firma</p>
        </div>
      </div>
    </body>
    </html>
  `
}