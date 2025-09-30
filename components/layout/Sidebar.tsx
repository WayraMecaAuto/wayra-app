'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Home, Package, Users, Settings, ChevronDown, ChevronRight, X, BarChart3,
  ChevronLeft, Plus, Activity, History, Filter, Droplets, Car, Bolt,
  FileText, ClipboardCheck, Wrench, Calculator, TrendingUp, DollarSign,
  PieChart, Building
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<any>
  children?: MenuItem[]
  roles?: string[]
  logo?: string
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS', 'MECANICO', 'VENDEDOR']
  },
  {
    title: 'Gestión de Usuarios',
    href: '/usuarios',
    icon: Users,
    roles: ['SUPER_USUARIO']
  },
  {
    title: 'Wayra',
    icon: Package,
    logo: '/images/WayraLogo.png',
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR'],
    children: [
      { 
        title: 'Productos Wayra', 
        href: '/inventario/productos-wayra', 
        icon: Package,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR']
      },
      { 
        title: 'Configuración', 
        href: '/wayra/configuracion', 
        icon: Settings,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS']
      },
      { 
        title: 'Reportes Wayra', 
        href: '/wayra/reportes', 
        icon: BarChart3,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS']
      },
      { 
        title: 'Contabilidad', 
        href: '/wayra/contabilidad', 
        icon: Calculator,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS']
      }
    ]
  },
  {
    title: 'TorniRepuestos',
    icon: Package,
    logo: '/images/TorniRepuestos.png',
    roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR'],
    children: [
      { title: 'Repuestos', href: '/inventario/repuestos', icon: Car, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR'] },
      { title: 'Filtros', href: '/inventario/filtros', icon: Filter, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR'] },
      { title: 'Lubricantes', href: '/inventario/lubricantes', icon: Droplets, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR'] },
      { title: 'Tornillería', href: '/inventario/tornilleria', icon: Bolt, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR'] },
      { 
        title: 'Configuración', 
        href: '/tornirepuestos/configuracion', 
        icon: Settings,
        roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS']
      },
      { 
        title: 'Reportes TorniRepuestos', 
        href: '/tornirepuestos/reportes', 
        icon: TrendingUp,
        roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS']
      },
      { 
        title: 'Contabilidad', 
        href: '/tornirepuestos/contabilidad', 
        icon: DollarSign,
        roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS']
      }
    ]
  },
  {
    title: 'Órdenes de Trabajo',
    icon: Wrench,
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'],
    children: [
      { title: 'Órdenes Activas', href: '/ordenes', icon: ClipboardCheck, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'] },
      { title: 'Nueva Orden', href: '/ordenes/nueva', icon: FileText, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Historial', href: '/ordenes/historial', icon: History, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] }
    ]
  },
  {
    title: 'Reportes Mecánicos',
    href: '/reportes/mecanicos',
    icon: PieChart,
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO']
  },
  {
    title: 'Configuración Sistema',
    href: '/configuracion',
    icon: Building,
    roles: ['SUPER_USUARIO']
  }
]

function MenuItem({ item, level = 0, isCollapsed, onItemClick }: { 
  item: MenuItem; 
  level?: number; 
  isCollapsed?: boolean;
  onItemClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const isActive = item.href ? pathname === item.href : false
  const hasActiveChild = item.children?.some(child => 
    pathname.startsWith(child.href || '')
  )

  // Verificar permisos de rol
  if (item.roles && !item.roles.includes(session?.user?.role || '')) {
    return null
  }

  const handleClick = () => {
    if (item.children) {
      setIsExpanded(!isExpanded)
    }
    if (onItemClick) {
      onItemClick()
    }
  }

  if (item.children) {
    // Filtrar hijos según permisos
    const visibleChildren = item.children.filter(child => 
      !child.roles || child.roles.includes(session?.user?.role || '')
    )

    if (visibleChildren.length === 0) {
      return null
    }

    return (
      <div className="space-y-1 relative">
        <button
          onClick={handleClick}
          onMouseEnter={() => isCollapsed && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden',
            level > 0 && 'ml-4',
            (hasActiveChild || isExpanded) 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-md',
            isCollapsed && level === 0 && 'justify-center px-3'
          )}
        >
          <div className="flex items-center space-x-3 relative z-10">
            {item.logo ? (
              <div className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg">
                <Image
                  src={item.logo}
                  alt={item.title}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
            ) : (
              <item.icon className="h-5 w-5 flex-shrink-0" />
            )}
            {!isCollapsed && <span className="font-medium">{item.title}</span>}
          </div>
          {!isCollapsed && (
            <div className={cn(
              "transition-transform duration-300 relative z-10",
              isExpanded ? "rotate-90" : ""
            )}>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
        </button>

        {/* Tooltip para sidebar colapsado */}
        {isCollapsed && showTooltip && (
          <div className="absolute left-full ml-3 top-0 z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-xl animate-fade-in">
            {item.title}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}

        {/* Submenú expandido */}
        {isExpanded && !isCollapsed && (
          <div className="space-y-1 animate-slide-in ml-6 border-l-2 border-blue-100 pl-4">
            {visibleChildren.map((child, index) => (
              <MenuItem key={index} item={child} level={level + 1} isCollapsed={isCollapsed} onItemClick={onItemClick} />
            ))}
          </div>
        )}

        {/* Submenú para sidebar colapsado */}
        {isCollapsed && isExpanded && (
          <div className="absolute left-full ml-3 top-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl py-3 min-w-56 animate-scale-in">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
              {item.title}
            </div>
            {visibleChildren.map((child, index) => (
              <Link
                key={index}
                href={child.href || '#'}
                onClick={onItemClick}
                className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 mx-2 rounded-lg"
              >
                {child.logo ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Image
                      src={child.logo}
                      alt={child.title}
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <child.icon className="h-4 w-4" />
                )}
                <span className="font-medium">{child.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Link
        href={item.href || '#'}
        onClick={onItemClick}
        onMouseEnter={() => isCollapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden',
          level > 0 && 'ml-4',
          isActive 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-md',
          isCollapsed && level === 0 && 'justify-center px-3'
        )}
      >
        <div className="flex items-center space-x-3 relative z-10">
          {item.logo ? (
            <div className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-lg">
              <Image
                src={item.logo}
                alt={item.title}
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
          ) : (
            <item.icon className="h-5 w-5 flex-shrink-0" />
          )}
          {!isCollapsed && <span className="font-medium">{item.title}</span>}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
      </Link>

      {/* Tooltip para sidebar colapsado */}
      {isCollapsed && showTooltip && (
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-xl animate-fade-in">
          {item.title}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: session } = useSession()

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_USUARIO': return 'Super Usuario'
      case 'ADMIN_WAYRA_TALLER': return 'Admin Taller'
      case 'ADMIN_WAYRA_PRODUCTOS': return 'Admin Wayra'
      case 'ADMIN_TORNI_REPUESTOS': return 'Admin TorniRepuestos'
      case 'MECANICO': return 'Mecánico'
      case 'VENDEDOR': return 'Vendedor'
      default: return role
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 flex flex-col bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-300 ease-in-out z-30 shadow-2xl',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-0',
        isCollapsed ? 'w-20' : 'w-72'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between h-16 px-4 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50',
          isCollapsed && 'px-3 justify-center'
        )}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Sistema Wayra
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Collapse button for desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className={cn(
                "h-5 w-5 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )} />
            </button>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <MenuItem 
              key={index} 
              item={item} 
              isCollapsed={isCollapsed} 
              onItemClick={() => setIsOpen(false)}
            />
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
            <div className="text-xs text-gray-500 text-center">
              <div className="font-semibold text-gray-700 mb-1">Sistema Wayra v1.0</div>
              <div className="text-gray-400">Fase 1 - {getRoleDisplayName(session?.user?.role || '')}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}