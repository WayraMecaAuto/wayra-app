'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, Package, ShoppingCart, TrendingUp, AlertTriangle, 
  Clock, Calendar, CheckCircle, XCircle, Activity, BarChart3,
  Wrench, FileText, Target, Award, DollarSign, Plus, Car,
  ClipboardCheck, Filter, Droplets, Bolt, ArrowRight, TrendingDown,
  Eye, Edit, Trash2, UserPlus, PackagePlus, FileSpreadsheet
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

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

interface QuickAction {
  title: string
  description: string
  href: string
  icon: any
  color: string
  gradient: string
  roles?: string[]
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
    if (currentDay === 0) return false
    if (currentDay === 6) {
      return (currentHour >= 8 && currentHour < 12) || 
             (currentHour === 12 && currentMinutes <= 30)
    }
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

  const getQuickActions = (): QuickAction[] => {
    const userRole = session?.user?.role || ''
    
    const allActions: QuickAction[] = [
      {
        title: 'Gestionar Usuarios',
        description: 'Crear y administrar usuarios',
        href: '/usuarios',
        icon: UserPlus,
        color: 'text-blue-600',
        gradient: 'from-blue-500 to-blue-600',
        roles: ['SUPER_USUARIO']
      },
      {
        title: 'Productos Wayra',
        description: 'Gestionar productos Wayra',
        href: '/inventario/productos-wayra',
        icon: PackagePlus,
        color: 'text-green-600',
        gradient: 'from-green-500 to-green-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR_WAYRA']
      },
      {
        title: 'Repuestos',
        description: 'Gestionar repuestos e inventario',
        href: '/inventario/repuestos',
        icon: Package,
        color: 'text-orange-600',
        gradient: 'from-orange-500 to-orange-600',
        roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI']
      },
      {
        title: 'Nueva Orden',
        description: 'Crear orden de servicio',
        href: '/ordenes/nueva',
        icon: Plus,
        color: 'text-purple-600',
        gradient: 'from-purple-500 to-purple-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER']
      },
      {
        title: 'Órdenes Activas',
        description: 'Ver y gestionar órdenes',
        href: '/ordenes',
        icon: ClipboardCheck,
        color: 'text-indigo-600',
        gradient: 'from-indigo-500 to-indigo-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO']
      },
      {
        title: 'Facturación',
        description: 'Gestionar facturas',
        href: '/facturacion',
        icon: FileText,
        color: 'text-pink-600',
        gradient: 'from-pink-500 to-pink-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER']
      },
      {
        title: 'Clientes',
        description: 'Administrar clientes',
        href: '/clientes',
        icon: Users,
        color: 'text-cyan-600',
        gradient: 'from-cyan-500 to-cyan-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER']
      },
      {
        title: 'Reportes',
        description: 'Ver estadísticas y análisis',
        href: '/reportes/wayra-taller',
        icon: BarChart3,
        color: 'text-emerald-600',
        gradient: 'from-emerald-500 to-emerald-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS']
      },
      {
        title: 'Contabilidad',
        description: 'Ver ingresos y egresos',
        href: '/contabilidad/wayra-taller',
        icon: DollarSign,
        color: 'text-teal-600',
        gradient: 'from-teal-500 to-teal-600',
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS']
      }
    ]
    
    return allActions.filter(action => 
      !action.roles || action.roles.includes(userRole)
    ).slice(0, 6)
  }

  const quickActions = getQuickActions()

  if (!canViewDashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <div className="text-red-500 text-2xl font-bold">Acceso Denegado</div>
          <p className="text-gray-600">No tienes permisos para ver el dashboard</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-2xl animate-slide-in-up">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 animate-fade-in">
              ¡Bienvenido, {session?.user?.name}! 👋
            </h1>
            <p className="text-blue-100 text-lg mb-4 animate-fade-in-delay-1">
              Sistema de Inventarios - {getRoleDisplayName(session?.user?.role || '')}
            </p>
            <div className="flex flex-wrap items-center gap-3 animate-fade-in-delay-2">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isWorkingHours() ? '🟢 Taller Abierto' : '🔴 Taller Cerrado'}
                </span>
              </div>
              <span className="text-sm text-blue-200 bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2">
                {getWorkingHoursText()}
              </span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4 animate-slide-in-right">
            <div className="logo-container">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                <Image
                  src="/images/WayraLogo.png"
                  alt="Wayra"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="logo-container delay-1">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
                <Image
                  src="/images/TorniRepuestos.png"
                  alt="TorniRepuestos"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group quick-action-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:border-transparent hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ir ahora
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          Estadísticas Generales
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-sm font-medium text-blue-700">
                Usuarios
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl font-bold text-blue-800 mb-1">{stats.totalUsers}</div>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.activeUsers} activos
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card delay-1 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-sm font-medium text-green-700">
                Productos
              </CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl font-bold text-green-800 mb-1">{stats.totalProducts}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                En inventario
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card delay-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-sm font-medium text-orange-700">
                Stock Bajo
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-600 animate-pulse" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl font-bold text-orange-800 mb-1">{stats.lowStockProducts}</div>
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card delay-3 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-sm font-medium text-purple-700">
                Valor Total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-800 mb-1">
                ${stats.totalInventoryValue.toLocaleString()}
              </div>
              <p className="text-xs text-purple-600 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Inventario
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentMovements.length > 0 && (
        <Card className="shadow-xl border-0 bg-white animate-fade-in">
          <CardHeader className="p-4 sm:p-6 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-xl font-bold">Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-4">
            <div className="space-y-3">
              {stats.recentMovements.slice(0, 5).map((movement: any, index: number) => (
                <div 
                  key={index} 
                  className="activity-item flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      movement.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' :
                      movement.tipo === 'SALIDA' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {movement.tipo === 'ENTRADA' ? '📦' : movement.tipo === 'SALIDA' ? '📤' : '⚙️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{movement.producto.nombre}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {movement.tipo} - {movement.cantidad} unidades por {movement.usuario.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(movement.fecha).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Section with Logos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Hours */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 animate-slide-in-left">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-xl font-bold">Horarios del Taller</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                <span className="font-medium text-gray-700 text-sm">Lunes - Viernes</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
                  <div className="text-sm font-semibold text-blue-600">2:00 PM - 6:00 PM</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                <span className="font-medium text-gray-700 text-sm">Sábados</span>
                <div className="text-sm font-semibold text-blue-600">8:00 AM - 12:30 PM</div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <span className="font-medium text-gray-700 text-sm">Domingos</span>
                <div className="text-sm font-semibold text-red-600">Cerrado</div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border-2 ${
              isWorkingHours() 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  isWorkingHours() ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <span className={`font-semibold text-sm ${
                  isWorkingHours() ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isWorkingHours() ? 'Taller Abierto' : 'Taller Cerrado'}
                </span>
              </div>
              <p className={`text-xs ${
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

        {/* Company Logos */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50 animate-slide-in-right overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Award className="h-5 w-5 text-purple-600" />
              <span className="text-xl font-bold">Nuestras Marcas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="floating-logo text-center p-6 bg-white rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer group">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/images/WayraLogo.png"
                    alt="Wayra"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Wayra</div>
                <div className="text-xs text-gray-500">Mecánica Automotriz</div>
              </div>
              
              <div className="floating-logo delay-2 text-center p-6 bg-white rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer group">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Image
                    src="/images/TorniRepuestos.png"
                    alt="TorniRepuestos"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">TorniRepuestos</div>
                <div className="text-xs text-gray-500">Repuestos & Accesorios</div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 text-sm">Sistema Integrado</h4>
                  <p className="text-xs text-purple-600">Gestión completa de inventario y servicios</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-fade-in-delay-1 {
          animation: fadeIn 0.6s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.8s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }
        
        .quick-action-card {
          animation: slideInUp 0.6s ease-out both;
        }
        
        .stat-card {
          animation: slideInUp 0.6s ease-out both;
        }
        
        .stat-card.delay-1 {
          animation-delay: 0.1s;
        }
        
        .stat-card.delay-2 {
          animation-delay: 0.2s;
        }
        
        .stat-card.delay-3 {
          animation-delay: 0.3s;
        }
        
        .activity-item {
          animation: slideInLeft 0.5s ease-out both;
        }
        
        .logo-container {
          animation: float 3s ease-in-out infinite;
        }
        
        .logo-container.delay-1 {
          animation-delay: 0.5s;
        }
        
        .floating-logo {
          animation: float 4s ease-in-out infinite;
        }
        
        .floating-logo.delay-2 {
          animation-delay: 1s;
        }
        
        @media (max-width: 640px) {
          .text-3xl {
            font-size: 1.75rem;
          }
          
          .text-4xl {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}