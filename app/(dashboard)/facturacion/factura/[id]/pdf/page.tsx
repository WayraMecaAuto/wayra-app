'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface Factura {
  id: string
  numeroFactura: string
  fecha: string
  vencimiento: string | null
  subtotal: number
  iva: number
  total: number
  estado: string
  observaciones: string | null
  cliente: {
    nombre: string
    numeroDocumento: string
    email: string | null
    telefono: string | null
    direccion: string | null
  }
  orden: {
    numeroOrden: string
    descripcion: string
    fechaCreacion: string
    manoDeObra: number
    vehiculo: {
      placa: string
      marca: string
      modelo: string
      anio: number | null
    }
    servicios: Array<{
      descripcion: string
      precio: number
    }>
    detalles: Array<{
      cantidad: number
      precioUnitario: number
      subtotal: number
      producto: {
        nombre: string
        codigo: string
        aplicaIva: boolean
      }
    }>
    repuestosExternos: Array<{
      nombre: string
      descripcion: string | null
      cantidad: number
      precioUnitario: number
      subtotal: number
    }>
  }
}

export default function FacturaPDFPage() {
  const params = useParams()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchFactura()
    }
  }, [params.id])

  useEffect(() => {
    if (factura) {
      // Auto-imprimir cuando se carga la factura
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [factura])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturacion/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFactura(data)
      }
    } catch (error) {
      console.error('Error fetching factura:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generando factura...</p>
        </div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Factura no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 1cm;
            size: letter;
          }
        }
      `}</style>

      {/* Factura */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header de la Factura */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-800">
          <div className="flex items-start space-x-4">
            <Image
              src="/images/WayraLogo.png"
              alt="Wayra Logo"
              width={100}
              height={100}
              className="object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Wayra Taller</h1>
              <p className="text-sm text-gray-700">Sistema de Gestión Automotriz</p>
              <p className="text-sm text-gray-700">NIT: 900123456-7</p>
              <p className="text-sm text-gray-700">Calle 123 #45-67, Bogotá, Colombia</p>
              <p className="text-sm text-gray-700">Tel: +57 1 234 5678</p>
              <p className="text-sm text-gray-700">Email: info@wayra.com</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block mb-3">
              <p className="text-sm font-medium">FACTURA</p>
              <p className="text-2xl font-bold">{factura.numeroFactura}</p>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><span className="font-semibold">Fecha de Emisión:</span><br/>{new Date(factura.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {factura.vencimiento && (
                <p><span className="font-semibold">Fecha de Vencimiento:</span><br/>{new Date(factura.vencimiento).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
              <p><span className="font-semibold">Orden de Servicio:</span><br/>{factura.orden.numeroOrden}</p>
            </div>
          </div>
        </div>

        {/* Info Cliente y Vehículo */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-gray-300 rounded-lg p-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase mb-3 pb-2 border-b-2 border-blue-600">
              Facturado a
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900 text-base">{factura.cliente.nombre}</p>
              <p><span className="font-medium">Documento:</span> {factura.cliente.numeroDocumento}</p>
              {factura.cliente.telefono && (
                <p><span className="font-medium">Teléfono:</span> {factura.cliente.telefono}</p>
              )}
              {factura.cliente.email && (
                <p><span className="font-medium">Email:</span> {factura.cliente.email}</p>
              )}
              {factura.cliente.direccion && (
                <p><span className="font-medium">Dirección:</span> {factura.cliente.direccion}</p>
              )}
            </div>
          </div>
          <div className="border border-gray-300 rounded-lg p-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase mb-3 pb-2 border-b-2 border-blue-600">
              Información del Vehículo
            </h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Placa:</span> <span className="font-bold text-lg">{factura.orden.vehiculo.placa}</span></p>
              <p><span className="font-medium">Marca:</span> {factura.orden.vehiculo.marca}</p>
              <p><span className="font-medium">Modelo:</span> {factura.orden.vehiculo.modelo}</p>
              {factura.orden.vehiculo.anio && (
                <p><span className="font-medium">Año:</span> {factura.orden.vehiculo.anio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de Servicios */}
        {factura.orden.servicios.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 bg-gray-100 p-2 rounded">
              Servicios Realizados
            </h3>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left p-3 font-semibold">Descripción del Servicio</th>
                  <th className="text-right p-3 font-semibold w-32">Precio</th>
                </tr>
              </thead>
              <tbody>
                {factura.orden.servicios.map((servicio, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-3">{servicio.descripcion}</td>
                    <td className="p-3 text-right font-medium">${servicio.precio.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalle de Productos */}
        {factura.orden.detalles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 bg-gray-100 p-2 rounded">
              Productos Utilizados
            </h3>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left p-3 font-semibold w-24">Código</th>
                  <th className="text-left p-3 font-semibold">Descripción</th>
                  <th className="text-center p-3 font-semibold w-20">Cant.</th>
                  <th className="text-right p-3 font-semibold w-28">Precio Unit.</th>
                  <th className="text-right p-3 font-semibold w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {factura.orden.detalles.map((detalle, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-3 text-xs">{detalle.producto.codigo}</td>
                    <td className="p-3">
                      {detalle.producto.nombre}
                      {detalle.producto.aplicaIva && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">(+IVA 19%)</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">{detalle.cantidad}</td>
                    <td className="p-3 text-right">${detalle.precioUnitario.toLocaleString('es-CO')}</td>
                    <td className="p-3 text-right font-semibold">${detalle.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalle de Repuestos Externos */}
        {factura.orden.repuestosExternos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 bg-gray-100 p-2 rounded">
              Repuestos Externos
            </h3>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left p-3 font-semibold">Descripción</th>
                  <th className="text-center p-3 font-semibold w-20">Cant.</th>
                  <th className="text-right p-3 font-semibold w-28">Precio Unit.</th>
                  <th className="text-right p-3 font-semibold w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {factura.orden.repuestosExternos.map((repuesto, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="p-3">
                      <div className="font-medium">{repuesto.nombre}</div>
                      {repuesto.descripcion && (
                        <div className="text-xs text-gray-600 mt-1">{repuesto.descripcion}</div>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">{repuesto.cantidad}</td>
                    <td className="p-3 text-right">${repuesto.precioUnitario.toLocaleString('es-CO')}</td>
                    <td className="p-3 text-right font-semibold">${repuesto.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div className="flex justify-end mb-8">
          <div className="w-96 border-2 border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-white p-3">
              <h3 className="font-bold text-center">RESUMEN DE FACTURA</h3>
            </div>
            <div className="p-4 space-y-3">
              {factura.orden.manoDeObra > 0 && (
                <div className="flex justify-between text-sm pb-2 border-b border-gray-300">
                  <span className="font-medium">Mano de Obra:</span>
                  <span className="font-semibold">${factura.orden.manoDeObra.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between text-base pb-2 border-b border-gray-300">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">${factura.subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-base pb-2 border-b border-gray-300">
                <span className="font-medium">IVA (19%):</span>
                <span className="font-semibold">${factura.iva.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 bg-blue-50 p-3 rounded">
                <span className="text-gray-900">TOTAL A PAGAR:</span>
                <span className="text-blue-600">${factura.total.toLocaleString('es-CO')} COP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {factura.observaciones && (
          <div className="mb-8 border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Observaciones</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{factura.observaciones}</p>
          </div>
        )}

        {/* Términos y Condiciones */}
        <div className="mb-8 text-xs text-gray-600 border-t-2 border-gray-300 pt-4">
          <h3 className="font-bold text-gray-900 mb-2">TÉRMINOS Y CONDICIONES:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Esta factura debe ser pagada antes de la fecha de vencimiento indicada.</li>
            <li>Los servicios prestados tienen garantía según las políticas del taller.</li>
            <li>Los repuestos instalados tienen la garantía del fabricante.</li>
            <li>El cliente debe presentar esta factura para cualquier reclamo o garantía.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-6 text-center">
          <p className="text-sm font-semibold text-gray-900 mb-2">¡Gracias por confiar en Wayra Taller!</p>
          <p className="text-xs text-gray-600">Para cualquier consulta sobre esta factura, contáctenos:</p>
          <p className="text-xs text-gray-600">Tel: +57 1 234 5678 | Email: info@wayra.com</p>
          <p className="text-xs text-gray-500 mt-3">Documento generado electrónicamente | Válido sin firma</p>
        </div>
      </div>
    </div>
  )
}