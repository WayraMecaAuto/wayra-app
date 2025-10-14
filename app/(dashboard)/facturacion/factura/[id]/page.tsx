'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Edit, XCircle, CheckCircle, Printer } from 'lucide-react'
import Link from 'next/link'
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
    manoDeObra: number
  }
}

export default function FacturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [actualizandoEstado, setActualizandoEstado] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchFactura()
    }
  }, [params.id])

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

  const handleMarcarPagada = async () => {
    if (!confirm('¿Marcar esta factura como pagada?')) return

    try {
      setActualizandoEstado(true)
      const response = await fetch(`/api/facturacion/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'PAGADA' })
      })

      if (response.ok) {
        fetchFactura()
        alert('Factura marcada como pagada')
      }
    } catch (error) {
      console.error('Error actualizando factura:', error)
      alert('Error al actualizar factura')
    } finally {
      setActualizandoEstado(false)
    }
  }

  const handleAnular = async () => {
    if (!confirm('¿Está seguro de anular esta factura? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/facturacion/${params.id}/anular`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Factura anulada exitosamente')
        router.push('/facturacion')
      }
    } catch (error) {
      console.error('Error anulando factura:', error)
      alert('Error al anular factura')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    window.open(`/facturacion/factura/${params.id}/pdf`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Factura no encontrada</p>
      </div>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      PAGADA: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagada' },
      VENCIDA: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vencida' },
      ANULADA: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Anulada' }
    }
    return badges[estado as keyof typeof badges] || badges.PENDIENTE
  }

  const estadoBadge = getEstadoBadge(factura.estado)

  return (
    <div className="space-y-6">
      {/* Header - No imprimir */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <Link
            href="/facturacion"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Factura {factura.numeroFactura}</h1>
            <p className="text-gray-600 mt-1">Detalles de la factura</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {factura.estado === 'PENDIENTE' && (
            <>
              <button
                onClick={handleMarcarPagada}
                disabled={actualizandoEstado}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Marcar Pagada</span>
              </button>
              <Link
                href={`/facturacion/factura/${factura.id}/edit`}
                className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </Link>
              <button
                onClick={handleAnular}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Anular</span>
              </button>
            </>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Factura - Formato para imprimir */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
        {/* Header de la Factura */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-start space-x-4">
            <Image
              src="/images/WayraLogo.png"
              alt="Wayra Logo"
              width={80}
              height={80}
              className="object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Wayra Taller</h2>
              <p className="text-sm text-gray-600 mt-1">Sistema de Gestión Automotriz</p>
              <p className="text-sm text-gray-600">NIT: 900123456-7</p>
              <p className="text-sm text-gray-600">Tel: +57 1 234 5678</p>
              <p className="text-sm text-gray-600">info@wayra.com</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center space-x-2 mb-3">
              <span className="text-3xl font-bold text-blue-600">{factura.numeroFactura}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoBadge.bg} ${estadoBadge.text}`}>
                {estadoBadge.label}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Fecha:</span> {new Date(factura.fecha).toLocaleDateString('es-CO')}</p>
              {factura.vencimiento && (
                <p><span className="font-medium">Vencimiento:</span> {new Date(factura.vencimiento).toLocaleDateString('es-CO')}</p>
              )}
              <p><span className="font-medium">Orden:</span> {factura.orden.numeroOrden}</p>
            </div>
          </div>
        </div>

        {/* Info Cliente y Vehículo */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
              Información del Cliente
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Nombre:</span> {factura.cliente.nombre}</p>
              <p><span className="font-medium text-gray-700">Documento:</span> {factura.cliente.numeroDocumento}</p>
              {factura.cliente.telefono && (
                <p><span className="font-medium text-gray-700">Teléfono:</span> {factura.cliente.telefono}</p>
              )}
              {factura.cliente.email && (
                <p><span className="font-medium text-gray-700">Email:</span> {factura.cliente.email}</p>
              )}
              {factura.cliente.direccion && (
                <p><span className="font-medium text-gray-700">Dirección:</span> {factura.cliente.direccion}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
              Información del Vehículo
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Placa:</span> {factura.orden.vehiculo.placa}</p>
              <p><span className="font-medium text-gray-700">Marca:</span> {factura.orden.vehiculo.marca}</p>
              <p><span className="font-medium text-gray-700">Modelo:</span> {factura.orden.vehiculo.modelo}</p>
              {factura.orden.vehiculo.anio && (
                <p><span className="font-medium text-gray-700">Año:</span> {factura.orden.vehiculo.anio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de Servicios */}
        {factura.orden.servicios.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
              Servicios Realizados
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Descripción</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {factura.orden.servicios.map((servicio, idx) => (
                  <tr key={idx}>
                    <td className="p-3">{servicio.descripcion}</td>
                    <td className="p-3 text-right font-medium">${servicio.precio.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalle de Productos */}
        {factura.orden.detalles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
              Productos Utilizados
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Código</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Descripción</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Cant.</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Precio Unit.</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {factura.orden.detalles.map((detalle, idx) => (
                  <tr key={idx}>
                    <td className="p-3">{detalle.producto.codigo}</td>
                    <td className="p-3">
                      {detalle.producto.nombre}
                      {detalle.producto.aplicaIva && (
                        <span className="ml-2 text-xs text-blue-600">(+IVA)</span>
                      )}
                    </td>
                    <td className="p-3 text-center">{detalle.cantidad}</td>
                    <td className="p-3 text-right">${detalle.precioUnitario.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">${detalle.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalle de Repuestos Externos */}
        {factura.orden.repuestosExternos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b border-gray-200 pb-2">
              Repuestos Externos
            </h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">Descripción</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Cant.</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Precio Unit.</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {factura.orden.repuestosExternos.map((repuesto, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <div>{repuesto.nombre}</div>
                      {repuesto.descripcion && (
                        <div className="text-xs text-gray-500">{repuesto.descripcion}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">{repuesto.cantidad}</td>
                    <td className="p-3 text-right">${repuesto.precioUnitario.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">${repuesto.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div className="flex justify-end mt-8">
          <div className="w-80 space-y-3">
            {factura.orden.manoDeObra > 0 && (
              <div className="flex justify-between text-sm pb-2 border-b border-gray-200">
                <span className="text-gray-600">Mano de Obra:</span>
                <span className="font-medium">${factura.orden.manoDeObra.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pb-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${factura.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pb-2 border-b border-gray-200">
              <span className="text-gray-600">IVA (19%):</span>
              <span className="font-medium">${factura.iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">${factura.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {factura.observaciones && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-2">Observaciones</h3>
            <p className="text-sm text-gray-600">{factura.observaciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Gracias por confiar en Wayra Taller</p>
          <p className="mt-1">Para cualquier consulta, contáctenos al +57 1 234 5678 o info@wayra.com</p>
        </div>
      </div>
    </div>
  )
}