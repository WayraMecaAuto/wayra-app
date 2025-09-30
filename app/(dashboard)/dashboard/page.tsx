'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Package, ShoppingCart, TrendingUp, AlertTriangle, 
  Clock, Calendar, CheckCircle, XCircle, Activity, BarChart3,
  Wrench, FileText, Target, Award
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
    totalInventoryValue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Simular carga de estadísticas reales
      // En producción, estas vendrían de APIs reales
      setStats({
        totalUsers: 4,
        activeUsers: 4,
        totalProducts: 0,
        lowStockProducts: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalInventoryValue: 0
      })
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

  const completedFeatures = [
    { name: 'Sistema de Autenticación', icon: CheckCircle, color: 'text-green-600' },
    { name: 'CRUD de Usuarios', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Base de Datos Configurada', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Cálculo Automático de Precios', icon: CheckCircle, color: 'text-green-600' },
    { name: 'Sistema de Códigos de Barras', icon: CheckCircle, color: 'text-green-600' }
  ]

  const nextSteps = [
    { name: 'CRUD de Inventario Completo', icon: Package, color: 'text-blue-600', priority: 'Alta' },
    { name: 'Sistema de Órdenes de Trabajo', icon: Wrench, color: 'text-purple-600', priority: 'Alta' },
    { name: 'Integración Códigos de Barras', icon: Activity, color: 'text-orange-600', priority: 'Media' },
    { name: 'Reportes para Mecánicos', icon: BarChart3, color: 'text-green-600', priority: 'Media' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {session?.user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Sistema de Inventarios
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {isWorkingHours() ? '🟢 Taller Abierto' : '🔴 Taller Cerrado'}
              </span>
              <span className="text-blue-200">•</span>
              <span className="text-sm text-blue-200">{getWorkingHoursText()}</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/WayraLogo.png"
                alt="Wayra"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/TorniRepuestos.png"
                alt="TorniRepuestos"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Usuarios
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.activeUsers} activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Productos
            </CardTitle>
            <Package className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{stats.totalProducts}</div>
            <p className="text-xs text-green-600 mt-1">
              En inventario
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{stats.lowStockProducts}</div>
            <p className="text-xs text-orange-600 mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Valor Inventario
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">
              ${stats.totalInventoryValue.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Valor total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Acciones Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {session?.user?.role === 'ADMIN' && (
              <>
                <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Gestionar Usuarios</div>
                </button>
                <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 shadow-lg">
                  <Package className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Agregar Producto</div>
                </button>
              </>
            )}
            <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg">
              <Wrench className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Nueva Orden</div>
            </button>
            <button className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg">
              <BarChart3 className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">Ver Reportes</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Horarios del Taller */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Horarios del Taller</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                <span className="font-medium text-gray-700">Lunes - Viernes</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
                  <div className="text-sm font-semibold text-blue-600">2:00 PM - 6:00 PM</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                <span className="font-medium text-gray-700">Sábados</span>
                <div className="text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                <span className="font-medium text-gray-700">Domingos</span>
                <div className="text-sm font-semibold text-red-600">Cerrado</div>
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
                <span className={`font-semibold ${
                  isWorkingHours() ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isWorkingHours() ? 'Taller Abierto' : 'Taller Cerrado'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
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
      </div>
    </div>
  )
}