"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import WayraLogo from "@/public/images/WayraNuevoLogo.png";

interface Factura {
  id: string;
  numeroFactura: string;
  fecha: string;
  vencimiento: string | null;
  subtotal: number;
  iva: number;
  total: number;
  estado: string;
  observaciones: string | null;
  cliente: {
    nombre: string;
    numeroDocumento: string;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
  };
  orden: {
    numeroOrden: string;
    descripcion: string;
    fechaCreacion: string;
    vehiculo: {
      placa: string;
      marca: string;
      modelo: string;
      anio: number | null;
    };
    servicios: Array<{
      descripcion: string;
      precio: number;
    }>;
    detalles: Array<{
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      producto: {
        nombre: string;
        codigo: string;
        aplicaIva: boolean;
      };
    }>;
    repuestosExternos: Array<{
      nombre: string;
      descripcion: string | null;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>;
    manoDeObra: number;
  };
}

export default function FacturaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchFactura();
    }
  }, [params.id]);

  const fetchFactura = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/facturacion/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFactura(data);
      }
    } catch (error) {
      console.error("Error fetching factura:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnular = async () => {
    if (
      !confirm(
        "¿Está seguro de anular esta factura? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      const response = await fetch(`/api/facturacion/${params.id}/anular`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Factura anulada exitosamente");
        router.push("/facturacion");
      }
    } catch (error) {
      console.error("Error anulando factura:", error);
      alert("Error al anular factura");
    }
  };

  const handleDownloadPDF = async () => {
    if (!factura) return;

    try {
      setDownloading(true);

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF("p", "mm", "letter");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      let logoBase64 = "";
      try {
        const logoModule = await import("@/public/images/WayraNuevoLogo.png");
        const res = await fetch(logoModule.default.src);
        if (res.ok) {
          const blob = await res.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } catch (err) {
        console.warn("Logo no disponible");
      }

      // Función para verificar espacio y agregar página
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin, y, 25, 25);
      }

      // Nombre y datos de la empresa
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Wayra", margin + 30, y + 8);

      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text("Mecánica Automotriz", margin + 30, y + 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("NIT: 1152700355-6", margin + 30, y + 20);
      doc.text("Cel: 317 606 7449", margin + 30, y + 24);
      doc.text("wayramecanicaautomotriz@gmail.com", margin + 30, y + 28);

      // Número de factura y estado (lado derecho)
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(factura.numeroFactura, pageWidth - margin, y + 8, {
        align: "right",
      });

      // Badge de estado
      const estadoMap: Record<string, { text: string; color: number[] }> = {
        PAGADA: { text: "Pagada", color: [34, 197, 94] },
        PENDIENTE: { text: "Pendiente", color: [251, 191, 36] },
        VENCIDA: { text: "Vencida", color: [239, 68, 68] },
        ANULADA: { text: "Anulada", color: [156, 163, 175] },
      };
      const estado = estadoMap[factura.estado] || estadoMap.PENDIENTE;

      const badgeWidth = 40;
      const badgeHeight = 8;
      const badgeX = pageWidth - margin - badgeWidth;
      const badgeY = y + 12;

      doc.setFillColor(...estado.color);
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        estado.text,
        badgeX + badgeWidth / 2,
        badgeY + badgeHeight / 2 + 1.5,
        { align: "center" }
      );

      // Fechas
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha: ${new Date(factura.fecha).toLocaleDateString("es-CO")}`,
        pageWidth - margin,
        y + 25,
        { align: "right" }
      );
      if (factura.vencimiento) {
        doc.text(
          `Vencimiento: ${new Date(factura.vencimiento).toLocaleDateString("es-CO")}`,
          pageWidth - margin,
          y + 30,
          { align: "right" }
        );
      }
      doc.text(
        `Orden: ${factura.orden.numeroOrden}`,
        pageWidth - margin,
        y + (factura.vencimiento ? 35 : 30),
        { align: "right" }
      );

      y += 40;

      // Línea separadora
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      checkPageBreak(50);

      // Fondo gris claro
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, contentWidth / 2 - 3, 40, "F");
      doc.rect(margin + contentWidth / 2 + 3, y, contentWidth / 2 - 3, 40, "F");

      // Borde
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, contentWidth / 2 - 3, 40);
      doc.rect(margin + contentWidth / 2 + 3, y, contentWidth / 2 - 3, 40);

      // Headers
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      doc.text("INFORMACIÓN DEL CLIENTE", margin + 2, y + 5);
      doc.text(
        "INFORMACIÓN DEL VEHÍCULO",
        margin + contentWidth / 2 + 5,
        y + 5
      );

      // Línea debajo del header
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + 7, margin + contentWidth / 2 - 3, y + 7);
      doc.line(margin + contentWidth / 2 + 3, y + 7, pageWidth - margin, y + 7);

      // Datos del cliente
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81);
      let clienteY = y + 12;

      doc.text("Nombre:", margin + 2, clienteY);
      doc.setFont("helvetica", "normal");
      const nombreLines = doc.splitTextToSize(
        factura.cliente.nombre,
        contentWidth / 2 - 20
      );
      doc.text(nombreLines, margin + 20, clienteY);
      clienteY += nombreLines.length * 4;

      doc.setFont("helvetica", "bold");
      doc.text("Documento:", margin + 2, clienteY);
      doc.setFont("helvetica", "normal");
      doc.text(factura.cliente.numeroDocumento, margin + 20, clienteY);
      clienteY += 4;

      if (factura.cliente.telefono) {
        doc.setFont("helvetica", "bold");
        doc.text("Teléfono:", margin + 2, clienteY);
        doc.setFont("helvetica", "normal");
        doc.text(factura.cliente.telefono, margin + 20, clienteY);
        clienteY += 4;
      }

      if (factura.cliente.email) {
        doc.setFont("helvetica", "bold");
        doc.text("Email:", margin + 2, clienteY);
        doc.setFont("helvetica", "normal");
        const emailLines = doc.splitTextToSize(
          factura.cliente.email,
          contentWidth / 2 - 20
        );
        doc.text(emailLines, margin + 20, clienteY);
        clienteY += emailLines.length * 4;
      }

      if (factura.cliente.direccion) {
        doc.setFont("helvetica", "bold");
        doc.text("Dirección:", margin + 2, clienteY);
        doc.setFont("helvetica", "normal");
        const dirLines = doc.splitTextToSize(
          factura.cliente.direccion,
          contentWidth / 2 - 20
        );
        doc.text(dirLines, margin + 20, clienteY);
      }

      // Datos del vehículo
      let vehiculoY = y + 12;
      const vehiculoX = margin + contentWidth / 2 + 5;

      doc.setFont("helvetica", "bold");
      doc.text("Placa:", vehiculoX, vehiculoY);
      doc.setFont("helvetica", "normal");
      doc.text(factura.orden.vehiculo.placa, vehiculoX + 15, vehiculoY);
      vehiculoY += 4;

      doc.setFont("helvetica", "bold");
      doc.text("Marca:", vehiculoX, vehiculoY);
      doc.setFont("helvetica", "normal");
      doc.text(factura.orden.vehiculo.marca, vehiculoX + 15, vehiculoY);
      vehiculoY += 4;

      doc.setFont("helvetica", "bold");
      doc.text("Modelo:", vehiculoX, vehiculoY);
      doc.setFont("helvetica", "normal");
      doc.text(factura.orden.vehiculo.modelo, vehiculoX + 15, vehiculoY);
      vehiculoY += 4;

      if (factura.orden.vehiculo.anio) {
        doc.setFont("helvetica", "bold");
        doc.text("Año:", vehiculoX, vehiculoY);
        doc.setFont("helvetica", "normal");
        doc.text(
          String(factura.orden.vehiculo.anio),
          vehiculoX + 15,
          vehiculoY
        );
      }

      y += 45;

      const addTableSection = (title: string, columns: any[], rows: any[]) => {
        if (rows.length === 0) return;

        checkPageBreak(30);

        // Header de la sección
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(55, 65, 81);
        doc.text(title.toUpperCase(), margin, y);

        // Línea debajo del título
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 6;

        autoTable(doc, {
          columns,
          body: rows,
          startY: y,
          theme: "plain",
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [229, 231, 235],
            lineWidth: 0.3,
          },
          headStyles: {
            fillColor: [249, 250, 251],
            textColor: [55, 65, 81],
            fontStyle: "bold",
            halign: "left",
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255],
          },
          margin: { left: margin, right: margin },
          tableWidth: "auto",
          didDrawPage: (data) => {
            y = data.cursor.y;
          },
        });

        y = (doc as any).lastAutoTable.finalY + 8;
      };

      // Servicios
      if (factura.orden.servicios.length > 0 || factura.orden.manoDeObra > 0) {
        const rows = factura.orden.servicios.map((s) => [
          s.descripcion,
          `$${s.precio.toLocaleString("es-CO")}`,
        ]);
        if (factura.orden.manoDeObra > 0) {
          rows.push([
            "Mano de Obra",
            `$${factura.orden.manoDeObra.toLocaleString("es-CO")}`,
          ]);
        }
        addTableSection(
          "Servicios Realizados",
          [
            { header: "Descripción", dataKey: "desc" },
            { header: "Precio", dataKey: "precio" },
          ],
          rows.map((r) => ({ desc: r[0], precio: r[1] }))
        );
      }

      // Productos
      if (factura.orden.detalles.length > 0) {
        const rows = factura.orden.detalles.map((d) => ({
          codigo: d.producto.codigo,
          desc: d.producto.nombre + (d.producto.aplicaIva ? " (+IVA)" : ""),
          cant: d.cantidad,
          precio: `$${d.precioUnitario.toLocaleString("es-CO")}`,
          subtotal: `$${d.subtotal.toLocaleString("es-CO")}`,
        }));
        addTableSection(
          "Productos Utilizados",
          [
            { header: "Código", dataKey: "codigo" },
            { header: "Descripción", dataKey: "desc" },
            { header: "Cant.", dataKey: "cant" },
            { header: "Precio Unit.", dataKey: "precio" },
            { header: "Subtotal", dataKey: "subtotal" },
          ],
          rows
        );
      }

      // Repuestos externos
      if (factura.orden.repuestosExternos.length > 0) {
        const rows = factura.orden.repuestosExternos.map((r) => ({
          desc: r.nombre + (r.descripcion ? `\n${r.descripcion}` : ""),
          cant: r.cantidad,
          precio: `$${r.precioUnitario.toLocaleString("es-CO")}`,
          subtotal: `$${r.subtotal.toLocaleString("es-CO")}`,
        }));
        addTableSection(
          "Repuestos Externos",
          [
            { header: "Descripción", dataKey: "desc" },
            { header: "Cant.", dataKey: "cant" },
            { header: "Precio Unit.", dataKey: "precio" },
            { header: "Subtotal", dataKey: "subtotal" },
          ],
          rows
        );
      }

      checkPageBreak(35);

      const boxWidth = 80;
      const boxX = pageWidth - margin - boxWidth;

      // Fondo
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(boxX, y, boxWidth, 30, 2, 2, "F");

      // Borde
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.roundedRect(boxX, y, boxWidth, 30, 2, 2);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);

      // Subtotal
      doc.text("Subtotal:", boxX + 5, y + 8);
      doc.text(
        `$${factura.subtotal.toLocaleString("es-CO")}`,
        pageWidth - margin - 5,
        y + 8,
        { align: "right" }
      );

      // Línea separadora
      doc.setDrawColor(209, 213, 219);
      doc.line(boxX + 5, y + 18, pageWidth - margin - 5, y + 18);

      // Total
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("Total:", boxX + 5, y + 26);
      doc.text(
        `$${factura.total.toLocaleString("es-CO")}`,
        pageWidth - margin - 5,
        y + 26,
        { align: "right" }
      );

      y += 35;

      if (factura.observaciones) {
        checkPageBreak(30);

        doc.setFillColor(249, 250, 251);
        const obsHeight = 25;
        doc.roundedRect(margin, y, contentWidth, obsHeight, 2, 2, "F");
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(margin, y, contentWidth, obsHeight, 2, 2);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(55, 65, 81);
        doc.text("OBSERVACIONES", margin + 3, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        const obsLines = doc.splitTextToSize(
          factura.observaciones,
          contentWidth - 6
        );
        doc.text(obsLines, margin + 3, y + 10);

        y += obsHeight + 5;
      }

      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Gracias por confiar en Wayra Mecánica Automotriz",
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        "Para cualquier consulta, contáctenos al 317 606 7449",
        pageWidth / 2,
        footerY + 4,
        { align: "center" }
      );

      const fecha = new Date(factura.fecha);
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const año = fecha.getFullYear();

      doc.save(
        `FACTURA_${factura.numeroFactura}_ORD_${factura.orden.numeroOrden}_${año}-${mes}.pdf`
      );
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Factura no encontrada</p>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      PENDIENTE: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pendiente",
      },
      PAGADA: { bg: "bg-green-100", text: "text-green-800", label: "Pagada" },
      VENCIDA: { bg: "bg-red-100", text: "text-red-800", label: "Vencida" },
      ANULADA: { bg: "bg-gray-100", text: "text-gray-800", label: "Anulada" },
    };
    return badges[estado as keyof typeof badges] || badges.PENDIENTE;
  };

  const estadoBadge = getEstadoBadge(factura.estado);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/facturacion"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Factura {factura.numeroFactura}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Detalles de la factura
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {factura.estado !== "ANULADA" && (
              <>
                <Link
                  href={`/facturacion/factura/${factura.id}/edit`}
                  className="flex items-center justify-center space-x-2 bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm sm:text-base flex-1 sm:flex-initial min-w-[100px]"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </Link>
                <button
                  onClick={handleAnular}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base flex-1 sm:flex-initial min-w-[100px]"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Anular</span>
                </button>
              </>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-initial min-w-[140px]"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? "Generando..." : "Descargar PDF"}</span>
            </button>
          </div>
        </div>

        {/* Factura */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Header de la Factura */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 border-b-2 border-gray-200">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src="/images/WayraNuevoLogo.png"
                  alt="Wayra Logo"
                  width={60}
                  height={60}
                  className="object-contain sm:w-[80px] sm:h-[80px]"
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Wayra
                </h2>
                <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-1">
                  Mecánica Automotriz
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  NIT: 1152700355-6
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Cel: 317 606 7449
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  wayramecanicaautomotriz@gmail.com
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                  {factura.numeroFactura}
                </span>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${estadoBadge.bg} ${estadoBadge.text}`}
                >
                  {estadoBadge.label}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Fecha:</span>{" "}
                  {new Date(factura.fecha).toLocaleDateString("es-CO")}
                </p>
                {factura.vencimiento && (
                  <p>
                    <span className="font-medium">Vencimiento:</span>{" "}
                    {new Date(factura.vencimiento).toLocaleDateString("es-CO")}
                  </p>
                )}
                <p>
                  <span className="font-medium">Orden:</span>{" "}
                  {factura.orden.numeroOrden}
                </p>
              </div>
            </div>
          </div>

          {/* Info Cliente y Vehículo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
                Información del Cliente
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="break-words">
                  <span className="font-medium text-gray-700">Nombre:</span>{" "}
                  {factura.cliente.nombre}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Documento:</span>{" "}
                  {factura.cliente.numeroDocumento}
                </p>
                {factura.cliente.telefono && (
                  <p>
                    <span className="font-medium text-gray-700">Teléfono:</span>{" "}
                    {factura.cliente.telefono}
                  </p>
                )}
                {factura.cliente.email && (
                  <p className="break-all">
                    <span className="font-medium text-gray-700">Email:</span>{" "}
                    {factura.cliente.email}
                  </p>
                )}
                {factura.cliente.direccion && (
                  <p className="break-words">
                    <span className="font-medium text-gray-700">
                      Dirección:
                    </span>{" "}
                    {factura.cliente.direccion}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
                Información del Vehículo
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  <span className="font-medium text-gray-700">Placa:</span>{" "}
                  {factura.orden.vehiculo.placa}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Marca:</span>{" "}
                  {factura.orden.vehiculo.marca}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Modelo:</span>{" "}
                  {factura.orden.vehiculo.modelo}
                </p>
                {factura.orden.vehiculo.anio && (
                  <p>
                    <span className="font-medium text-gray-700">Año:</span>{" "}
                    {factura.orden.vehiculo.anio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detalle de Servicios */}
          {(factura.orden.servicios.length > 0 ||
            factura.orden.manoDeObra > 0) && (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
                Servicios Realizados
              </h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-semibold text-gray-700">
                        Descripción
                      </th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 whitespace-nowrap">
                        Precio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factura.orden.servicios.map((servicio, idx) => (
                      <tr key={idx}>
                        <td className="p-2 sm:p-3">{servicio.descripcion}</td>
                        <td className="p-2 sm:p-3 text-right font-medium whitespace-nowrap">
                          ${servicio.precio.toLocaleString()}
                        </td>
                      </tr>
                    ))}

                    {factura.orden.manoDeObra > 0 && (
                      <tr>
                        <td className="p-2 sm:p-3 font-medium text-gray-700">
                          Mano de Obra
                        </td>
                        <td className="p-2 sm:p-3 text-right font-medium whitespace-nowrap">
                          ${factura.orden.manoDeObra.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalle de Productos */}
          {factura.orden.detalles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
                Productos Utilizados
              </h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-semibold text-gray-700">
                        Código
                      </th>
                      <th className="text-left p-2 sm:p-3 font-semibold text-gray-700">
                        Descripción
                      </th>
                      <th className="text-center p-2 sm:p-3 font-semibold text-gray-700">
                        Cant.
                      </th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 whitespace-nowrap">
                        Precio Unit.
                      </th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 whitespace-nowrap">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factura.orden.detalles.map((detalle, idx) => (
                      <tr key={idx}>
                        <td className="p-2 sm:p-3 text-xs">
                          {detalle.producto.codigo}
                        </td>
                        <td className="p-2 sm:p-3">
                          <div className="break-words">
                            {detalle.producto.nombre}
                          </div>
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          {detalle.cantidad}
                        </td>
                        <td className="p-2 sm:p-3 text-right whitespace-nowrap">
                          ${detalle.precioUnitario.toLocaleString()}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-medium whitespace-nowrap">
                          ${detalle.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalle de Repuestos Externos */}
          {factura.orden.repuestosExternos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
                Repuestos Externos
              </h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[500px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-semibold text-gray-700">
                        Descripción
                      </th>
                      <th className="text-center p-2 sm:p-3 font-semibold text-gray-700">
                        Cant.
                      </th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 whitespace-nowrap">
                        Precio Unit.
                      </th>
                      <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 whitespace-nowrap">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {factura.orden.repuestosExternos.map((repuesto, idx) => (
                      <tr key={idx}>
                        <td className="p-2 sm:p-3">
                          <div className="break-words">{repuesto.nombre}</div>
                          {repuesto.descripcion && (
                            <div className="text-xs text-gray-500 mt-1 break-words">
                              {repuesto.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          {repuesto.cantidad}
                        </td>
                        <td className="p-2 sm:p-3 text-right whitespace-nowrap">
                          ${repuesto.precioUnitario.toLocaleString()}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-medium whitespace-nowrap">
                          ${repuesto.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="flex justify-end mt-6 sm:mt-8">
            <div className="w-full sm:w-80 space-y-2 sm:space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-xs sm:text-sm pb-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium whitespace-nowrap">
                  ${factura.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold pt-2 sm:pt-3 border-t-2 border-gray-300">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600 whitespace-nowrap">
                  ${factura.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {factura.observaciones && (
            <div className="mt-6 sm:mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase mb-2">
                Observaciones
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap break-words">
                {factura.observaciones}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-600">
            <p>Gracias por confiar en Wayra Mecánica Automotriz</p>
            <p className="mt-1">
              Para cualquier consulta, contáctenos al 317 060 7449
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
