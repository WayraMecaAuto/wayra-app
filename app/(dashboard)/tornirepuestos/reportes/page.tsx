'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  BarChart3, TrendingUp, Package, DollarSign, Calendar, 
  Download, Filter, RefreshCw, Eye, FileText, PieChart,
  Car, Droplets, Bolt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function TorniRepuestosReportesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>({})

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchReportData()
    }
  }, [hasAccess])

  const fetchReportData = async () => {
    try {
      // Simular datos de reportes
      setReportData({
        ventasRepuestos: 2100000,
        ventasFiltros: 650000,
        ventasLubricantes: 450000,
        ventasTornilleria: 320000,
        productosTotal: 156,
        stockBajo: 12,
        movimientosHoy: 18
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/TorniRepuestos.png"
                alt="TorniRepuestos Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Reportes TorniRepuestos</h1>
              <p className="text-red-100 text-lg">Análisis por categorías de productos</p>
            </div>
          </div>
          <Button className="bg-white text-red-800 hover:bg-red-50 shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reportes
          </Button>
        </div>
      </div>

      {/* Stats Cards por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Repuestos</CardTitle>
            <Car className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">${reportData.ventasRepuestos?.toLocaleString()}</div>
            <p className="text-xs text-red-600 mt-1">Ventas este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Filtros</CardTitle>
            <Filter className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-800">${reportData.ventasFiltros?.toLocaleString()}</div>
            <p className="text-xs text-teal-600 mt-1">Ventas este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Lubricantes</CardTitle>
            <Droplets className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-800">${reportData.ventasLubricantes?.toLocaleString()}</div>
            <p className="text-xs text-indigo-600 mt-1">Ventas este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tornillería</CardTitle>
            <Bolt className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">${reportData.ventasTornilleria?.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Ventas este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <BarChart3 className="h-5 w-5 text-red-600" />
              <span>Reportes de Ventas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <BarChart3 className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Reportes detallados por categoría</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Package className="h-5 w-5 text-green-600" />
              <span>Análisis de Inventario</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <Package className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Rotación y análisis de stock</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}