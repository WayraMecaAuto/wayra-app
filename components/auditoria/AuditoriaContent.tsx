'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Download, Calendar, User, FileText, Eye, X, Shield, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
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
  'CREAR',
  'EDITAR',
  'ELIMINAR',
  'VENTA',
  'ENTRADA_INVENTARIO',
  'SALIDA_INVENTARIO',
  'COMPLETAR_ORDEN',
  'CANCELAR_ORDEN',
  'GENERAR_FACTURA',
  'ANULAR_FACTURA',
  'CREAR_EGRESO',
  'OTRO'
]

const ENTIDADES = [
  'Usuario',
  'Producto',
  'Orden',
  'Cliente',
  'Vehiculo',
  'Factura',
  'Inventario',
  'Venta',
  'Egreso'
]

const ACCION_COLORS: Record<string, string> = {
  CREAR: 'bg-green-100 text-green-800',
  EDITAR: 'bg-blue-100 text-blue-800',
  ELIMINAR: 'bg-red-100 text-red-800',
  VENTA: 'bg-purple-100 text-purple-800',
  ENTRADA_INVENTARIO: 'bg-teal-100 text-teal-800',
  SALIDA_INVENTARIO: 'bg-orange-100 text-orange-800',
  COMPLETAR_ORDEN: 'bg-green-100 text-green-800',
  CANCELAR_ORDEN: 'bg-red-100 text-red-800',
  GENERAR_FACTURA: 'bg-indigo-100 text-indigo-800',
  ANULAR_FACTURA: 'bg-red-100 text-red-800',
  CREAR_EGRESO: 'bg-yellow-100 text-yellow-800',
  OTRO: 'bg-gray-100 text-gray-800'
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

  // Modal de detalles
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
      console.error('Error:', error)
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
      
      // Convertir a CSV
      const csv = convertirACSV(data.auditorias)
      
      // Descargar archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `auditoria_${new Date().toISOString()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Auditoría exportada exitosamente')
    } catch (error) {
      console.error('Error:', error)
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
      a.descripcion,
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

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {estadisticas.slice(0, 3).map((stat) => (
          <div key={stat.accion} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.accion.replace(/_/g, ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.cantidad}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h3>
          <div className="flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Limpiar
            </button>
            <button
              onClick={exportarAuditoria}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => {
                setFiltroAccion(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {ACCIONES.map(accion => (
                <option key={accion} value={accion}>
                  {accion.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
            <select
              value={filtroEntidad}
              onChange={(e) => {
                setFiltroEntidad(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {ENTIDADES.map(entidad => (
                <option key={entidad} value={entidad}>{entidad}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => {
                setFiltroFechaInicio(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => {
                setFiltroFechaFin(e.target.value)
                setPage(1)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de auditorías */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Cargando auditorías...
                  </td>
                </tr>
              ) : auditorias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                auditorias.map((auditoria) => (
                  <tr key={auditoria.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(auditoria.createdAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{auditoria.usuario.name}</div>
                        <div className="text-xs text-gray-500">{auditoria.usuario.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ACCION_COLORS[auditoria.accion]}`}>
                        {auditoria.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {auditoria.entidad}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {auditoria.descripcion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {auditoria.ip || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => verDetalles(auditoria)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} de {total} registros
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedAuditoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Detalles de Auditoría</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedAuditoria.createdAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Usuario</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAuditoria.usuario.name}</p>
                    <p className="text-xs text-gray-500">{selectedAuditoria.usuario.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acción</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${ACCION_COLORS[selectedAuditoria.accion]}`}>
                      {selectedAuditoria.accion.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entidad</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAuditoria.entidad}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAuditoria.ip || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAuditoria.usuario.role}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAuditoria.descripcion}</p>
                </div>

                {selectedAuditoria.datosAnteriores && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datos Anteriores</label>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedAuditoria.datosAnteriores, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedAuditoria.datosNuevos && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datos Nuevos</label>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedAuditoria.datosNuevos, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedAuditoria.userAgent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="mt-1 text-xs text-gray-600 break-all">
                      {selectedAuditoria.userAgent}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}