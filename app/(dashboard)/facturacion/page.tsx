'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, Plus, Search, Eye, Edit } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Factura {
  id: string
  numeroFactura: string
  fecha: string
  cliente: {
    nombre: string
    numeroDocumento: string
  }
  orden: {
    numeroOrden: string
    vehiculo: {
      placa: string
    }
  }
  total: number
  estado: string
}

export default function FacturacionPage() {
  const { data: session } = useSession()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchFacturas()
  }, [])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facturacion')
      if (response.ok) {
        const data = await response.json()
        setFacturas(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFacturas = facturas.filter(f =>
    f.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.orden?.vehiculo?.placa.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Facturación</h1>
              <p className="text-sm text-gray-600 mt-1">Gestión de facturas generadas</p>
            </div>
            <Link
              href="/facturacion/nueva"
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Factura</span>
              <span className="sm:hidden">Nueva</span>
            </Link>
          </div>
        </motion.header>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-4 border border-gray-100"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por factura, cliente o placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm sm:text-base"
            />
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Facturas', value: facturas.length, color: 'bg-blue-100 text-blue-700' },
            { label: 'Total Facturado', value: `$${facturas.filter(f => f.estado === 'PAGADA').reduce((a, f) => a + f.total, 0).toLocaleString()}`, color: 'bg-indigo-100 text-indigo-700' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-md p-5 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* TABLA RESPONSIVE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Listado de Facturas</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    {['Factura', 'Cliente', 'Orden', 'Placa', 'Fecha', 'Total', 'Acciones'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFacturas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No hay facturas
                      </td>
                    </tr>
                  ) : (
                    filteredFacturas.map((f, i) => (
                      <motion.tr
                        key={f.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{f.numeroFactura}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <div className="font-medium">{f.cliente.nombre}</div>
                            <div className="text-xs text-gray-500">{f.cliente.numeroDocumento}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">{f.orden?.numeroOrden}</td>
                        <td className="px-5 py-4 text-sm">{f.orden?.vehiculo?.placa}</td>
                        <td className="px-5 py-4 text-sm">
                          {new Date(f.fecha).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-5 py-4 font-semibold text-indigo-600">
                          ${f.total.toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <Link href={`/facturacion/factura/${f.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                              <Eye className="w-4 h-4" />
                            </Link>
                            {f.estado === 'PENDIENTE' && (
                              <Link href={`/facturacion/factura/${f.id}/edit`} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100">
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 p-4">
            {filteredFacturas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto w-12 h-12 text-gray-300 mb-2" />
                <p>No hay facturas</p>
              </div>
            ) : (
              filteredFacturas.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-gray-800">{f.numeroFactura}</span>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/facturacion/factura/${f.id}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {f.estado === 'PENDIENTE' && (
                        <Link href={`/facturacion/factura/${f.id}/edit`} className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Cliente</p>
                      <p className="font-medium">{f.cliente.nombre}</p>
                      <p className="text-xs text-gray-500">{f.cliente.numeroDocumento}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Orden / Placa</p>
                      <p className="font-medium">{f.orden?.numeroOrden}</p>
                      <p className="text-xs text-gray-500">{f.orden?.vehiculo?.placa}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Fecha</p>
                      <p className="font-medium">{new Date(f.fecha).toLocaleDateString('es-CO')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-indigo-600">${f.total.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}