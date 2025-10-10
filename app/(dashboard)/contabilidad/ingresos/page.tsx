'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { TrendingUp, DollarSign, Calendar, FileText, Download, ListFilter as Filter, RefreshCw, CircleCheck as CheckCircle, Car, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface Ingreso {
  id: string
  fecha: string
  concepto: string
  descripcion: string
  monto: number
  utilidad: number
  tipo: string
}

export default function IngresosPage() {
  const { data: session } = useSession()
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [totales, setTotales] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filterMes, setFilterMes] = useState<string>(new Date().getMonth() + 1 + '')
  const [filterAño, setFilterAño] = useState<string>(new Date().getFullYear() + '')

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchIngresos()
    }
  }, [hasAccess, filterMes, filterAño])

  const fetchIngresos = async () => {
    try {
      let url = '/api/contabilidad/ingresos?'
      const params = new URLSearchParams()
      
      if (filterMes !== 'ALL') params.append('mes', filterMes)
      if (filterAño !== 'ALL') params.append('año', filterAño)
      
      const response = await fetch(`${url}${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setIngresos(data.ingresos)
        setTotales(data.totales)
      } else {
        toast.error('Error al cargar ingresos')
      }
    } catch (error) {
      toast.error('Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="h-6 sm:h-10 w-6 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Ingresos</h1>
              <p className="text-green-100 text-base sm:text-lg">
                Registro de ingresos por órdenes completadas
              </p>
            </div>
          </div>
          <Button className="bg-white text-green-600 hover:bg-green-50 shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Ingresos</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${totales.totalIngresos?.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Este período</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Utilidad</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              ${totales.totalUtilidad?.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 mt-1">Ganancia neta</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Órdenes</CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{totales.cantidad}</div>
            <p className="text-xs text-purple-600 mt-1">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="h-12 px-4 border-0 bg-white shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="h-12 px-4 border-0 bg-white shadow-md rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>

            <Button
              onClick={fetchIngresos}
              className="h-12 bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ingresos Table */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-gray-800">
            Registro de Ingresos ({ingresos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Concepto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Descripción</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Monto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((ingreso, index) => (
                  <tr 
                    key={ingreso.id} 
                    className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {new Date(ingreso.fecha).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{ingreso.concepto}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{ingreso.descripcion}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-green-600">${ingreso.monto.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-blue-600">${ingreso.utilidad.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {ingresos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">No hay ingresos registrados</div>
              <p className="text-gray-400 mt-2">
                Los ingresos se registran automáticamente al completar órdenes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}