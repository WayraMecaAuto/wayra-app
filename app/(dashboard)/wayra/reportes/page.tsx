'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  BarChart3, TrendingUp, Package, DollarSign, Calendar, 
  Download, Filter, RefreshCw, Eye, FileText, PieChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function WayraReportesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>({})

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchReportData()
    }
  }, [hasAccess])

  const fetchReportData = async () => {
    try {
      // Simular datos de reportes
      setReportData({
        ventasENI: 0,
        ventasCALAN: 0,
        productosENI: 0,
        productosCALAN: 0,
        stockBajo: 0,
        movimientosHoy: 0
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold mb-2">Reportes Wayra</h1>
              <p className="text-blue-100 text-lg">Análisis de ventas y productos ENI + CALAN</p>
            </div>
          </div>
          <Button className="bg-white text-blue-800 hover:bg-blue-50 shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reportes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Ventas ENI</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">${reportData.ventasENI?.toLocaleString()}</div>
            <p className="text-xs text-blue-600 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Ventas CALAN</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">${reportData.ventasCALAN?.toLocaleString()}</div>
            <p className="text-xs text-orange-600 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Productos ENI</CardTitle>
            <Package className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{reportData.productosENI}</div>
            <p className="text-xs text-green-600 mt-1">En inventario</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Productos CALAN</CardTitle>
            <PieChart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{reportData.productosCALAN}</div>
            <p className="text-xs text-purple-600 mt-1">En inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Reportes de Ventas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Reportes detallados de ventas Wayra</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Package className="h-5 w-5 text-green-600" />
              <span>Reportes de Inventario</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <Package className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Análisis de stock y rotación</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}