'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Search, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Orden {
  id: string
  numeroOrden: string
  cliente: {
    id: string
    nombre: string
    numeroDocumento: string
    email: string | null
    telefono: string | null
  }
  vehiculo: {
    placa: string
    marca: string
    modelo: string
  }
  estado: string
  total: number
  subtotalServicios: number
  subtotalProductos: number
  subtotalRepuestosExternos: number
  manoDeObra: number
  fechaCreacion: string
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
      aplicaIva: boolean
    }
  }>
  repuestosExternos: Array<{
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
}

export default function NuevaFacturaPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null)
  const [generatingFactura, setGeneratingFactura] = useState(false)

  useEffect(() => {
    fetchOrdenes()
  }, [])

  const fetchOrdenes = async () => {
    try {
      setLoading(true)
      // Obtener órdenes completadas
      const response = await fetch('/api/ordenes?estado=COMPLETADO')
      if (response.ok) {
        const data = await response.json()
        setOrdenes(data)
      }
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrdenes = ordenes.filter(orden =>
    orden.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGenerarFactura = async () => {
    if (!selectedOrden) {
      alert('No hay orden seleccionada')
      return
    }

    try {
      setGeneratingFactura(true)
      
      console.log('🔍 Orden seleccionada completa:', selectedOrden)
      console.log('🔍 Cliente de la orden:', selectedOrden.cliente)
      console.log('🔍 ID del cliente:', selectedOrden.cliente?.id)

      // Verificar que tenemos el clienteId
      if (!selectedOrden.cliente?.id) {
        alert('Error: No se pudo obtener el ID del cliente de la orden')
        console.error('❌ selectedOrden.cliente.id está undefined')
        console.error('Orden completa:', JSON.stringify(selectedOrden, null, 2))
        return
      }
      
      // Calcular IVA solo sobre productos que lo aplican
      let subtotalConIva = 0
      selectedOrden.detalles.forEach(detalle => {
        if (detalle.producto.aplicaIva) {
          subtotalConIva += detalle.subtotal
        }
      })

      const iva = subtotalConIva * 0.19 // 19% de IVA
      const subtotalTotal = selectedOrden.total
      const total = subtotalTotal + iva

      const facturaData = {
        ordenId: selectedOrden.id,
        clienteId: selectedOrden.cliente.id,
        subtotal: subtotalTotal,
        iva: iva,
        total: total,
        estado: 'PENDIENTE',
        observaciones: null,
        vencimiento: null
      }

      console.log('📤 Enviando datos de factura:', facturaData)
      console.log('✅ clienteId presente:', !!facturaData.clienteId)
      console.log('✅ ordenId presente:', !!facturaData.ordenId)

      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaData)
      })

      const responseData = await response.json()
      console.log('📥 Respuesta del servidor:', responseData)

      if (response.ok) {
        alert('Factura generada exitosamente')
        router.push(`/facturacion/factura/${responseData.id}`)
      } else {
        console.error('❌ Error en respuesta:', responseData)
        alert(`Error al generar factura: ${responseData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ Error generando factura:', error)
      alert('Error al generar factura')
    } finally {
      setGeneratingFactura(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/facturacion"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nueva Factura</h1>
            <p className="text-gray-600 mt-1">Selecciona una orden completada para facturar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Órdenes */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar orden, cliente o placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredOrdenes.map((orden) => (
              <button
                key={orden.id}
                onClick={() => setSelectedOrden(orden)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedOrden?.id === orden.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{orden.numeroOrden}</div>
                    <div className="text-sm text-gray-600 mt-1">{orden.cliente.nombre}</div>
                  </div>
                  {selectedOrden?.id === orden.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600">{orden.vehiculo.placa}</span>
                  <span className="font-semibold text-blue-600">
                    ${orden.total.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}

            {filteredOrdenes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay órdenes disponibles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron órdenes completadas para facturar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview de la Orden Seleccionada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedOrden ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Detalle de la Orden</h2>
                <FileText className="h-6 w-6 text-blue-500" />
              </div>

              {/* Info Cliente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Cliente</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="text-sm"><span className="font-medium">Nombre:</span> {selectedOrden.cliente.nombre}</div>
                  <div className="text-sm"><span className="font-medium">Documento:</span> {selectedOrden.cliente.numeroDocumento}</div>
                  {selectedOrden.cliente.email && (
                    <div className="text-sm"><span className="font-medium">Email:</span> {selectedOrden.cliente.email}</div>
                  )}
                  {selectedOrden.cliente.telefono && (
                    <div className="text-sm"><span className="font-medium">Teléfono:</span> {selectedOrden.cliente.telefono}</div>
                  )}
                </div>
              </div>

              {/* Info Vehículo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehículo</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <div className="text-sm"><span className="font-medium">Placa:</span> {selectedOrden.vehiculo.placa}</div>
                  <div className="text-sm"><span className="font-medium">Marca:</span> {selectedOrden.vehiculo.marca}</div>
                  <div className="text-sm"><span className="font-medium">Modelo:</span> {selectedOrden.vehiculo.modelo}</div>
                </div>
              </div>

              {/* Servicios */}
              {selectedOrden.servicios.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Servicios</h3>
                  <div className="space-y-2">
                    {selectedOrden.servicios.map((servicio, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 rounded-lg p-2">
                        <span>{servicio.descripcion}</span>
                        <span className="font-medium">${servicio.precio.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos */}
              {selectedOrden.detalles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Productos</h3>
                  <div className="space-y-2">
                    {selectedOrden.detalles.map((detalle, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 rounded-lg p-2">
                        <span>{detalle.producto.nombre} x{detalle.cantidad}</span>
                        <span className="font-medium">${detalle.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repuestos Externos */}
              {selectedOrden.repuestosExternos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Repuestos Externos</h3>
                  <div className="space-y-2">
                    {selectedOrden.repuestosExternos.map((repuesto, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-gray-50 rounded-lg p-2">
                        <span>{repuesto.nombre} x{repuesto.cantidad}</span>
                        <span className="font-medium">${repuesto.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totales */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {selectedOrden.manoDeObra > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Mano de Obra</span>
                    <span className="font-medium">${selectedOrden.manoDeObra.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">${selectedOrden.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA (19%)</span>
                  <span className="font-medium">
                    ${(() => {
                      let subtotalConIva = 0
                      selectedOrden.detalles.forEach(detalle => {
                        if (detalle.producto.aplicaIva) {
                          subtotalConIva += detalle.subtotal
                        }
                      })
                      return (subtotalConIva * 0.19).toLocaleString()
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Total</span>
                  <span className="text-blue-600">
                    ${(() => {
                      let subtotalConIva = 0
                      selectedOrden.detalles.forEach(detalle => {
                        if (detalle.producto.aplicaIva) {
                          subtotalConIva += detalle.subtotal
                        }
                      })
                      const iva = subtotalConIva * 0.19
                      return (selectedOrden.total + iva).toLocaleString()
                    })()}
                  </span>
                </div>
              </div>

              {/* Botón Generar */}
              <button
                onClick={handleGenerarFactura}
                disabled={generatingFactura}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {generatingFactura ? 'Generando...' : 'Generar Factura'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una orden</h3>
              <p className="text-sm text-gray-500">
                Elige una orden de la lista para ver su detalle y generar la factura
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}