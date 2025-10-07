'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Package, ShoppingCart, TrendingUp, AlertTriangle, 
  Clock, Calendar, CheckCircle, XCircle, Activity, BarChart3,
  Wrench, FileText, Target, Award, DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalProducts: number
  lowStockProducts: number
  totalOrders: number
  completedOrders: number
  totalInventoryValue: number
  productsByCategory: any[]
  recentMovements: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalInventoryValue: 0,
    productsByCategory: [],
    recentMovements: []
  })
  const [loading, setLoading] = useState(true)

  // Solo ciertos roles pueden ver el dashboard
  const canViewDashboard = ['SUPER_USUARIO'].includes(session?.user?.role || '')

  useEffect(() => {
    if (canViewDashboard) {
      fetchDashboardStats()
    }
  }, [canViewDashboard])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentTime = new Date()
  const currentHour = currentTime.getHours()
  const currentMinutes = currentTime.getMinutes()
  const currentDay = currentTime.getDay()
  
  const isWorkingHours = () => {
    if (currentDay === 0) return false // Domingo
    
    if (currentDay === 6) { // Sábado
      return (currentHour >= 8 && currentHour < 12) || 
             (currentHour === 12 && currentMinutes <= 30)
    }
    
    // Lunes a Viernes
    const morningShift = (currentHour >= 8 && currentHour < 12) || 
                         (currentHour === 12 && currentMinutes <= 30)
    const afternoonShift = (currentHour >= 14 && currentHour < 18)
    
    return morningShift || afternoonShift
  }

  const getWorkingHoursText = () => {
    if (currentDay === 0) return 'Cerrado los domingos'
    if (currentDay === 6) return 'Sábados: 8:00 AM - 12:30 PM'
    return 'Lun-Vie: 8:00 AM - 12:30 PM, 2:00 PM - 6:00 PM'
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_USUARIO': return 'Super Usuario'
      case 'ADMIN_WAYRA_TALLER': return 'Admin Taller'
      case 'ADMIN_WAYRA_PRODUCTOS': return 'Admin Wayra'
      case 'ADMIN_TORNI_REPUESTOS': return 'Admin TorniRepuestos'
      case 'MECANICO': return 'Mecánico'
      case 'VENDEDOR_WAYRA': return 'Vendedor Wayra'
      case 'VENDEDOR_TORNI': return 'Vendedor TorniRepuestos'
      default: return role
    }
  }

  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl font-bold mb-2">Acceso Denegado</div>
          <p className="text-gray-600">No tienes permisos para ver el dashboard</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-8 p-4 sm:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              ¡Bienvenido, {session?.user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Sistema de Inventarios - {getRoleDisplayName(session?.user?.role || '')}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-3 space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {isWorkingHours() ? '🟢 Taller Abierto' : '🔴 Taller Cerrado'}
                </span>
              </div>
              <span className="text-blue-200 hidden sm:inline">•</span>
              <span className="text-sm text-blue-200">{getWorkingHoursText()}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/WayraLogo.png"
                alt="Wayra"
                width={32}
                height={32}
                className="object-contain sm:w-10 sm:h-10"
              />
            </div>
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/TorniRepuestos.png"
                alt="TorniRepuestos"
                width={32}
                height={32}
                className="object-contain sm:w-10 sm:h-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
              Usuarios
            </CardTitle>
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-blue-800">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.activeUsers} activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-green-800">{stats.totalProducts}</div>
            <p className="text-xs text-green-600 mt-1">
              En inventario
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-xl sm:text-3xl font-bold text-orange-800">{stats.lowStockProducts}</div>
            <p className="text-xs text-orange-600 mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-3xl font-bold text-purple-800">
              ${stats.totalInventoryValue.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Inventario
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats.recentMovements.length > 0 && (
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {stats.recentMovements.slice(0, 5).map((movement: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      movement.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' :
                      movement.tipo === 'SALIDA' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {movement.tipo === 'ENTRADA' ? '📦' : movement.tipo === 'SALIDA' ? '📤' : '⚙️'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{movement.producto.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {movement.tipo} - {movement.cantidad} unidades por {movement.usuario.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(movement.fecha).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Horarios del Taller */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Horarios del Taller</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                <span className="font-medium text-gray-700 text-sm">Lunes - Viernes</span>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
                  <div className="text-xs sm:text-sm font-semibold text-blue-600">2:00 PM - 6:00 PM</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                <span className="font-medium text-gray-700 text-sm">Sábados</span>
                <div className="text-xs sm:text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="font-medium text-gray-700 text-sm">Domingos</span>
                <div className="text-xs sm:text-sm font-semibold text-red-600">Cerrado</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${
              isWorkingHours() 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isWorkingHours() ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <span className={`font-semibold text-sm ${
                  isWorkingHours() ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isWorkingHours() ? 'Taller Abierto' : 'Taller Cerrado'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${
                isWorkingHours() ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentTime.toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Award className="h-5 w-5 text-purple-600" />
              <span>Sistema Wayra</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-purple-100">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">v1.0</div>
                <div className="text-xs sm:text-sm text-gray-600">Versión</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg border border-purple-100">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">Fase 1</div>
                <div className="text-xs sm:text-sm text-gray-600">Completada</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 text-sm">Tu Rol: {getRoleDisplayName(session?.user?.role || '')}</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {session?.user?.role === 'SUPER_USUARIO' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Acceso total al sistema</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Gestión de usuarios</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Configuración del sistema</span>
                    </div>
                  </>
                )}
                {session?.user?.role === 'ADMIN_WAYRA_TALLER' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Dashboard del taller</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Órdenes de trabajo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Reportes mecánicos</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}