'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Search, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Orden {
  id: string
  numeroOrden: string
  clienteId: string
  cliente: {
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
      
      console.log('Orden seleccionada completa:', selectedOrden)
      console.log('Cliente ID de la orden:', selectedOrden.clienteId)

      if (!selectedOrden.clienteId) {
        alert('Error: No se pudo obtener el ID del cliente de la orden')
        console.error('selectedOrden.clienteId está undefined')
        console.error('Orden completa:', JSON.stringify(selectedOrden, null, 2))
        return
      }
      
      let subtotalConIva = 0
      selectedOrden.detalles.forEach(detalle => {
        if (detalle.producto.aplicaIva) {
          subtotalConIva += detalle.subtotal
        }
      })

      const iva = subtotalConIva * 0.19
      const subtotalTotal = selectedOrden.total
      const total = subtotalTotal + iva

      const facturaData = {
        ordenId: selectedOrden.id,
        clienteId: selectedOrden.clienteId,
        subtotal: subtotalTotal,
        iva: iva,
        total: total,
        estado: 'PENDIENTE',
        observaciones: null,
        vencimiento: null
      }

      console.log('Enviando datos de factura:', facturaData)

      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facturaData)
      })

      const responseData = await response.json()
      console.log('Respuesta del servidor:', responseData)

      if (response.ok) {
        alert('Factura generada exitosamente')
        router.push(`/facturacion/factura/${responseData.id}`)
      } else {
        console.error('Error en respuesta:', responseData)
        alert(`Error al generar factura: ${responseData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error generando factura:', error)
      alert('Error al generar factura')
    } finally {
      setGeneratingFactura(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con animación */}
        <div className="animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link
                href="/facturacion"
                className="group p-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Nueva Factura
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Selecciona una orden completada para facturar
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Lista de Órdenes - Izquierda */}
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 transform transition-all duration-300 hover:shadow-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Buscar orden, cliente o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full font-medium pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-300 outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Lista de órdenes con SCROLL VERTICAL FUNCIONAL */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div 
                className="max-h-96 sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 transition-all"
              >
                <div className="space-y-3 pb-2">
                  {filteredOrdenes.map((orden, index) => (
                    <button
                      key={orden.id}
                      onClick={() => setSelectedOrden(orden)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md ${
                        selectedOrden?.id === orden.id
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fade-in-up 0.4s ease-out forwards',
                        opacity: 0
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{orden.numeroOrden}</div>
                          <div className="text-sm text-gray-600 mt-1 font-medium">{orden.cliente.nombre}</div>
                        </div>
                        {selectedOrden?.id === orden.id && (
                          <CheckCircle className="h-6 w-6 text-blue-600 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          {orden.vehiculo.placa}
                        </span>
                        <span className="font-bold text-xl text-blue-600">
                          ${orden.total.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </button>
                  ))}

                  {filteredOrdenes.length === 0 && (
                    <div className="text-center py-16 animate-in fade-in duration-500">
                      <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">No hay órdenes disponibles</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No se encontraron órdenes completadas para facturar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview de Orden - Derecha */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 transition-all duration-500 hover:shadow-2xl">
            {selectedOrden ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Detalle de la Orden
                  </h2>
                  <FileText className="h-7 w-7 text-blue-600" />
                </div>

                {/* Cliente */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 transform transition-all hover:scale-[1.01]">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    Cliente
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-semibold">Nombre:</span> <span className="text-gray-700">{selectedOrden.cliente.nombre}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Documento:</span> <span className="text-gray-700">{selectedOrden.cliente.numeroDocumento}</span></div>
                    {selectedOrden.cliente.email && (
                      <div className="flex justify-between"><span className="font-semibold">Email:</span> <span className="text-gray-700">{selectedOrden.cliente.email}</span></div>
                    )}
                    {selectedOrden.cliente.telefono && (
                      <div className="flex justify-between"><span className="font-semibold">Teléfono:</span> <span className="text-gray-700">{selectedOrden.cliente.telefono}</span></div>
                    )}
                  </div>
                </div>

                {/* Vehículo */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 transform transition-all hover:scale-[1.01]">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    Vehículo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="font-semibold text-gray-600">Placa</div>
                      <div className="font-bold text-lg text-gray-800">{selectedOrden.vehiculo.placa}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="font-semibold text-gray-600">Marca</div>
                      <div className="font-bold text-gray-800">{selectedOrden.vehiculo.marca}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center">
                      <div className="font-semibold text-gray-600">Modelo</div>
                      <div className="font-bold text-gray-800">{selectedOrden.vehiculo.modelo}</div>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                {selectedOrden.servicios.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                      Servicios
                    </h3>
                    <div className="space-y-2">
                      {selectedOrden.servicios.map((servicio, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-white bg-opacity-70 rounded-xl p-3 backdrop-blur">
                          <span className="font-medium">{servicio.descripcion}</span>
                          <span className="font-bold text-purple-600">${servicio.precio.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Productos */}
                {selectedOrden.detalles.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                      Productos
                    </h3>
                    <div className="space-y-2">
                      {selectedOrden.detalles.map((detalle, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-white bg-opacity-70 rounded-xl p-3 backdrop-blur">
                          <span className="font-medium">{detalle.producto.nombre} × {detalle.cantidad}</span>
                          <span className="font-bold text-orange-600">${detalle.subtotal.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repuestos Externos */}
                {selectedOrden.repuestosExternos.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-teal-600 rounded-full mr-2"></div>
                      Repuestos Externos
                    </h3>
                    <div className="space-y-2">
                      {selectedOrden.repuestosExternos.map((repuesto, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-white bg-opacity-70 rounded-xl p-3 backdrop-blur">
                          <span className="font-medium">{repuesto.nombre} × {repuesto.cantidad}</span>
                          <span className="font-bold text-teal-600">${repuesto.subtotal.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totales */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white transform transition-all hover:scale-[1.01]">
                  <div className="space-y-3">
                    {selectedOrden.manoDeObra > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Mano de Obra</span>
                        <span className="font-bold">${selectedOrden.manoDeObra.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Subtotal</span>
                      <span className="font-bold">${selectedOrden.total.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">IVA (19%)</span>
                      <span className="font-bold">
                        ${(() => {
                          let subtotalConIva = 0
                          selectedOrden.detalles.forEach(detalle => {
                            if (detalle.producto.aplicaIva) {
                              subtotalConIva += detalle.subtotal
                            }
                          })
                          return (subtotalConIva * 0.19).toLocaleString('es-CO')
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold pt-3 border-t border-white border-opacity-30">
                      <span>Total</span>
                      <span>
                        ${(() => {
                          let subtotalConIva = 0
                          selectedOrden.detalles.forEach(detalle => {
                            if (detalle.producto.aplicaIva) {
                              subtotalConIva += detalle.subtotal
                            }
                          })
                          const iva = subtotalConIva * 0.19
                          return (selectedOrden.total + iva).toLocaleString('es-CO')
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón Generar */}
                <button
                  onClick={handleGenerarFactura}
                  disabled={generatingFactura}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100"
                >
                  {generatingFactura ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Generando...
                    </span>
                  ) : (
                    'Generar Factura'
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-in fade-in duration-700">
                <div className="relative">
                  <FileText className="h-20 w-20 text-gray-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-100 to-transparent rounded-full blur-xl opacity-50"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-6">Selecciona una orden</h3>
                <p className="mt-3 text-sm text-gray-500 max-w-xs">
                  Elige una orden de la lista para ver su detalle y generar la factura
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animaciones personalizadas */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-top-4 {
          animation: slide-in-from-top 0.5s ease-out;
        }

        .slide-in-from-bottom-4 {
          animation: slide-in-from-bottom 0.5s ease-out;
        }

        .fade-in {
          animation: fade-in-up 0.5s ease-out;
        }

        /* Scrollbar personalizado */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}