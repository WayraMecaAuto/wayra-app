'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, BarChart3, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface IngresoContable {
  id: string
  fecha: Date
  cantidad: number
  descripcion: string
  precioCompra: number
  precioVenta: number
  utilidad: number
  ordenId?: string
  productoId: string
}

interface EgresoContable {
  id: string
  fecha: Date
  descripcion: string
  valor: number
}

export default function ContabilidadWayraProductosPage() {
  const { data: session } = useSession()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [año, setAño] = useState(new Date().getFullYear())
  const [ingresos, setIngresos] = useState<IngresoContable[]>([])
  const [egresos, setEgresos] = useState<EgresoContable[]>([])
  const [loading, setLoading] = useState(true)

  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchContabilidad()
    }
  }, [hasAccess, mes, año])

  const fetchContabilidad = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contabilidad/wayra-productos?mes=${mes}&año=${año}`)
      if (response.ok) {
        const data = await response.json()
        setIngresos(data.ingresos)
        setEgresos(data.egresos)
      } else {
        toast.error('Error al cargar contabilidad')
      }
    } catch (error) {
      toast.error('Error al cargar contabilidad')
    } finally {
      setLoading(false)
    }
  }

  const calcularTotales = () => {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0)
    const totalCostos = ingresos.reduce((sum, i) => sum + i.precioCompra * i.cantidad, 0)
    const totalEgresos = egresos.reduce((sum, e) => sum + e.valor, 0)
    const totalUtilidad = totalIngresos - totalCostos - totalEgresos

    return {
      totalIngresos,
      totalCostos,
      totalEgresos,
      totalUtilidad
    }
}

  const totales = calcularTotales()

  if (!hasAccess) {
    redirect('/dashboard')
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
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Image
              src="/images/WayraLogo.png"
              alt="Wayra Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Contabilidad Productos Wayra</h1>
            <p className="text-blue-100 text-lg">Reporte de ingresos, egresos y utilidades</p>
          </div>
        </div>
      </div>

      {/* Selectores de mes y año */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-sm:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleString('es-CO', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 mt-auto">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Ingresos Totales</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${totales.totalIngresos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Costo Total</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              ${totales.totalCostos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Egresos</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              ${totales.totalEgresos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Utilidad Neta</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totales.totalUtilidad >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
              ${totales.totalUtilidad.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingresos detallados */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Ingresos por Ventas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Descripción</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">P. Compra</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">P. Venta</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal Venta</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((ingreso, index) => (
                  <tr key={ingreso.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-sm">
                      {new Date(ingreso.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium text-gray-900">{ingreso.descripcion}</div>
                      {ingreso.ordenId && (
                        <div className="text-xs text-gray-500">Orden: {ingreso.ordenId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">{ingreso.cantidad}</td>
                    <td className="py-3 px-4 text-right text-sm">
                      ${(ingreso.precioCompra).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-blue-600">
                      ${(ingreso.precioVenta).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                      ${(ingreso.precioVenta * ingreso.cantidad).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                      ${ingreso.utilidad.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-left">
                      {ingreso.ordenId ? (
                        <Badge className="bg-blue-100 text-blue-700">Orden</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Venta Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Egresos */}
      {egresos.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5" />
              <span>Egresos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Descripción</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {egresos.map((egreso, index) => (
                    <tr key={egreso.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-3 px-4 text-sm">
                        {new Date(egreso.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{egreso.descripcion}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-red-600">
                        -${egreso.valor.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}