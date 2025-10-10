'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Search, Eye, CreditCard as Edit, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, Car, User, Calendar, DollarSign, Wrench, FileText, ListFilter as Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OrdenServicio {
  id: string
  numeroOrden: string
  descripcion: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'
  fechaCreacion: string
  fechaInicio?: string
  fechaFin?: string
  total: number
  utilidad: number
  cliente: {
    nombre: string
    telefono?: string
  }
  vehiculo: {
    placa: string
    marca: string
    modelo: string
    año?: number
  }
  mecanico: {
    name: string
  }
  servicios: any[]
  detalles: any[]
  repuestosExternos: any[]
}

export default function OrdenesPage() {
  const { data: session } = useSession()
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('ALL')
  const [filterMes, setFilterMes] = useState<string>(new Date().getMonth() + 1 + '')
  const [filterAño, setFilterAño] = useState<string>(new Date().getFullYear() + '')

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchOrdenes()
    }
  }, [hasAccess, filterMes, filterAño, filterEstado])

  const fetchOrdenes = async () => {
    try {
      let url = '/api/ordenes?'
      const params = new URLSearchParams()
      
      if (filterMes !== 'ALL') params.append('mes', filterMes)
      if (filterAño !== 'ALL') params.append('año', filterAño)
      if (filterEstado !== 'ALL') params.append('estado', filterEstado)
      
      const response = await fetch(`${url}${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrdenes(data)
      } else {
        toast.error('Error al cargar órdenes')
      }
    } catch (error) {
      toast.error('Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Wrench className="h-3 w-3 mr-1" />
          En Proceso
        </Badge>
      case 'COMPLETADO':
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-800 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const filteredOrdenes = ordenes.filter(orden =>
    orden.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    pendientes: ordenes.filter(o => o.estado === 'PENDIENTE').length,
    enProceso: ordenes.filter(o => o.estado === 'EN_PROCESO').length,
    completadas: ordenes.filter(o => o.estado === 'COMPLETADO').length,
    totalVentas: ordenes.reduce((sum, o) => sum + o.total, 0),
    totalUtilidad: ordenes.reduce((sum, o) => sum + o.utilidad, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Wrench className="h-6 sm:h-10 w-6 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Órdenes Activas</h1>
              <p className="text-blue-100 text-base sm:text-lg">
                Gestión de órdenes de trabajo - {filterMes !== 'ALL' ? `${filterMes}/${filterAño}` : 'Todos los meses'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-yellow-700">Pendientes</CardTitle>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-yellow-800">{stats.pendientes}</div>
            <p className="text-xs text-yellow-600 mt-1">En cola</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">En Proceso</CardTitle>
            <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-blue-800">{stats.enProceso}</div>
            <p className="text-xs text-blue-600 mt-1">Activas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-green-800">{stats.completadas}</div>
            <p className="text-xs text-green-600 mt-1">Este período</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">Ventas</CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-800">
              ${stats.totalVentas.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">Total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-emerald-700">Utilidad</CardTitle>
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-emerald-800">
              ${stats.totalUtilidad.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 mt-1">Ganancia</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar órdenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-0 bg-white shadow-md focus:shadow-lg transition-shadow"
              />
            </div>
            
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="h-12 px-4 border-0 bg-white shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completadas</option>
              <option value="CANCELADO">Canceladas</option>
            </select>

            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="h-12 px-4 border-0 bg-white shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los meses</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>

            <select
              value={filterAño}
              onChange={(e) => setFilterAño(e.target.value)}
              className="h-12 px-4 border-0 bg-white shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Órdenes Table */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-gray-800 flex items-center justify-between">
            <span>Órdenes de Trabajo ({filteredOrdenes.length})</span>
            <Link href="/ordenes/nueva">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                <Wrench className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View */}
          <div className="block lg:hidden">
            {filteredOrdenes.map((orden) => (
              <div key={orden.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900">{orden.numeroOrden}</div>
                  {getEstadoBadge(orden.estado)}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span><strong>Cliente:</strong> {orden.cliente.nombre}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-gray-400" />
                    <span><strong>Vehículo:</strong> {orden.vehiculo.marca} {orden.vehiculo.modelo} - {orden.vehiculo.placa}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 text-gray-400" />
                    <span><strong>Mecánico:</strong> {orden.mecanico.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span><strong>Total:</strong> ${orden.total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span><strong>Fecha:</strong> {new Date(orden.fechaCreacion).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Orden</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Vehículo</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Estado</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Mecánico</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Total</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Utilidad</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdenes.map((orden, index) => (
                  <tr 
                    key={orden.id} 
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-gray-900">{orden.numeroOrden}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(orden.fechaCreacion).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{orden.cliente.nombre}</div>
                        {orden.cliente.telefono && (
                          <div className="text-sm text-gray-500">{orden.cliente.telefono}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">
                          {orden.vehiculo.marca} {orden.vehiculo.modelo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {orden.vehiculo.placa} {orden.vehiculo.año && `(${orden.vehiculo.año})`}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getEstadoBadge(orden.estado)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{orden.mecanico.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-green-600">${orden.total.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-emerald-600">${orden.utilidad.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6">
                          onClick={() => window.location.href = `/ordenes/${orden.id}`}
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                          onClick={() => window.location.href = `/ordenes/${orden.id}/edit`}
                        </Button>
                        <Button size="sm" variant="outline" className="hover:bg-green-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrdenes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-12 w-12 text-blue-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">No se encontraron órdenes</div>
              <p className="text-gray-400 mt-2">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay órdenes para este período'}
              </p>
              <Link href="/ordenes/nueva">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Wrench className="h-4 w-4 mr-2" />
                  Crear Primera Orden
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}