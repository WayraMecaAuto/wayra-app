'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Download, FileText, Eye, X, Calendar, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import DatePicker from '@/components/forms/DatePicker'
import Dropdown from '@/components/forms/Dropdown'

interface Auditoria {
  id: string
  accion: string
  entidad: string
  entidadId: string | null
  descripcion: string
  datosAnteriores: any
  datosNuevos: any
  ip: string | null
  userAgent: string | null
  createdAt: string
  usuario: {
    id: string
    name: string
    email: string
    role: string
  }
}

const ACCIONES = [
  'CREAR', 'EDITAR', 'ELIMINAR', 'VENTA', 'ENTRADA_INVENTARIO',
  'SALIDA_INVENTARIO', 'COMPLETAR_ORDEN', 'CANCELAR_ORDEN', 'CREAR_EGRESO', 'OTRO'
]

const ENTIDADES = [
  'Usuario', 'Producto', 'Orden', 'Cliente', 'Vehiculo',
  'Factura', 'Inventario', 'Venta', 'Egreso'
]

const ACCION_COLORS: Record<string, string> = {
  CREAR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EDITAR: 'bg-blue-100 text-blue-700 border-blue-200',
  ELIMINAR: 'bg-red-100 text-red-700 border-red-200',
  VENTA: 'bg-purple-100 text-purple-700 border-purple-200',
  ENTRADA_INVENTARIO: 'bg-teal-100 text-teal-700 border-teal-200',
  SALIDA_INVENTARIO: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETAR_ORDEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELAR_ORDEN: 'bg-red-100 text-red-700 border-red-200',
  CREAR_EGRESO: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function AuditoriaContent() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [estadisticas, setEstadisticas] = useState<any[]>([])

  // Filtros
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroEntidad, setFiltroEntidad] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  // Modal
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchAuditorias()
  }, [page, filtroAccion, filtroEntidad, filtroUsuario, filtroFechaInicio, filtroFechaFin])

  const fetchAuditorias = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })

      if (filtroAccion) params.append('accion', filtroAccion)
      if (filtroEntidad) params.append('entidad', filtroEntidad)
      if (filtroUsuario) params.append('usuarioId', filtroUsuario)
      if (filtroFechaInicio) params.append('fechaInicio', filtroFechaInicio)
      if (filtroFechaFin) params.append('fechaFin', filtroFechaFin)

      const response = await fetch(`/api/auditoria?${params}`)
      if (!response.ok) throw new Error('Error al cargar auditorías')
      const data = await response.json()

      setAuditorias(data.auditorias)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setEstadisticas(data.estadisticas)
    } catch (error) {
      toast.error('Error al cargar auditorías')
    } finally {
      setLoading(false)
    }
  }

  const exportarAuditoria = async () => {
    try {
      const body: any = {}
      if (filtroFechaInicio) body.fechaInicio = filtroFechaInicio
      if (filtroFechaFin) body.fechaFin = filtroFechaFin

      const response = await fetch('/api/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Error al exportar')
      const data = await response.json()

      const csv = convertirACSV(data.auditorias)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `auditoria_${new Date().toISOString().slice(0,10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Auditoría exportada correctamente')
    } catch (error) {
      toast.error('Error al exportar auditoría')
    }
  }

  const convertirACSV = (data: Auditoria[]) => {
    const headers = ['Fecha', 'Usuario', 'Rol', 'Acción', 'Entidad', 'Descripción', 'IP']
    const rows = data.map(a => [
      new Date(a.createdAt).toLocaleString('es-CO'),
      a.usuario.name,
      a.usuario.role,
      a.accion,
      a.entidad,
      a.descripcion.replace(/"/g, '""'),
      a.ip || 'N/A'
    ])

    return [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')
  }

  const limpiarFiltros = () => {
    setFiltroAccion('')
    setFiltroEntidad('')
    setFiltroUsuario('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPage(1)
  }

  const verDetalles = (auditoria: Auditoria) => {
    setSelectedAuditoria(auditoria)
    setShowModal(true)
  }

  const accionOptions = ACCIONES.map(a => ({ value: a, label: a.replace(/_/g, ' ') }))
  const entidadOptions = ENTIDADES.map(e => ({ value: e, label: e }))

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
                <p className="text-sm text-gray-600 mt-1">Registro completo de todas las acciones realizadas</p>
              </div>
              <button
                onClick={exportarAuditoria}
                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Registros</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{total.toLocaleString('es-CO')}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </motion.div>

            {estadisticas.slice(0, 3).map((stat, i) => (
              <motion.div
                key={stat.accion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (i + 1) * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.accion.replace(/_/g, ' ')}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.cantidad}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <Filter className="w-5 h-5" />
                Filtros de Búsqueda
              </h3>
              <button
                onClick={limpiarFiltros}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar todo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Acción</label>
                <Dropdown
                  options={[{ value: '', label: 'Todas las acciones' }, ...accionOptions]}
                  value={filtroAccion}
                  onChange={(v) => { setFiltroAccion(v as string); setPage(1) }}
                  placeholder="Seleccionar acción"
                  icon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Entidad</label>
                <Dropdown
                  options={[{ value: '', label: 'Todas las entidades' }, ...entidadOptions]}
                  value={filtroEntidad}
                  onChange={(v) => { setFiltroEntidad(v as string); setPage(1) }}
                  placeholder="Seleccionar entidad"
                />
              </div>

              <div className="space-y-2">
                <DatePicker
                  label="Fecha Inicio"
                  value={filtroFechaInicio}
                  onChange={(v) => { setFiltroFechaInicio(v); setPage(1) }}
                />
              </div>

              <div className="space-y-2">
                <DatePicker
                  label="Fecha Fin"
                  value={filtroFechaFin}
                  onChange={(v) => { setFiltroFechaFin(v); setPage(1) }}
                />
              </div>
            </div>
          </motion.div>

          {/* Tabla */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acción</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entidad</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Ver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                            <p>Cargando auditorías...</p>
                          </div>
                        </td>
                      </tr>
                    ) : auditorias.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center text-gray-500">
                          <p className="text-lg">No se encontraron registros con los filtros aplicados</p>
                        </td>
                      </tr>
                    ) : (
                      auditorias.map((auditoria) => (
                        <motion.tr
                          key={auditoria.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(auditoria.createdAt).toLocaleString('es-CO')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{auditoria.usuario.name}</div>
                                <div className="text-xs text-gray-500">{auditoria.usuario.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${ACCION_COLORS[auditoria.accion]}`}>
                              {auditoria.accion.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{auditoria.entidad}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={auditoria.descripcion}>
                            {auditoria.descripcion}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{auditoria.ip || 'N/A'}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => verDetalles(auditoria)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
                <p className="text-sm text-gray-700">
                  Mostrando {(page - 1) * 50 + 1} - {Math.min(page * 50, total)} de {total} registros
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de Detalles */}
      <AnimatePresence>
        {showModal && selectedAuditoria && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Detalle de Acción</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Fecha y Hora</p>
                      <p className="font-medium">{new Date(selectedAuditoria.createdAt).toLocaleString('es-CO')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Usuario</p>
                      <p className="font-medium">{selectedAuditoria.usuario.name}</p>
                      <p className="text-sm text-gray-500">{selectedAuditoria.usuario.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rol</p>
                      <p className="font-medium">{selectedAuditoria.usuario.role}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Acción</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${ACCION_COLORS[selectedAuditoria.accion]}`}>
                        {selectedAuditoria.accion.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Entidad</p>
                      <p className="font-medium">{selectedAuditoria.entidad}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IP</p>
                      <p className="font-mono text-sm">{selectedAuditoria.ip || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Descripción</p>
                  <p className="text-gray-900">{selectedAuditoria.descripcion}</p>
                </div>

                {selectedAuditoria.datosAnteriores && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Datos Anteriores</p>
                    <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto border border-gray-200">
                      {JSON.stringify(selectedAuditoria.datosAnteriores, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedAuditoria.datosNuevos && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">Datos Nuevos</p>
                    <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto border border-gray-200">
                      {JSON.stringify(selectedAuditoria.datosNuevos, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}