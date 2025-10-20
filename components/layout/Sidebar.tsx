'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Home, Package, Users, Settings, ChevronRight, X,
  ChevronLeft, Plus, History, Filter, Droplets, Car, Bolt,
  FileText, ClipboardCheck, Wrench, Calculator, TrendingUp, DollarSign,
  PieChart, Building, Stethoscope, BarChart3, Activity, Briefcase
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
    roles: ['SUPER_USUARIO']
  },
  {
    title: 'Gestión de Usuarios',
    href: '/usuarios',
    icon: Users,
    roles: ['SUPER_USUARIO']
  },
  {
    title: 'Wayra Productos',
    icon: Package,
    logo: '/images/WayraLogo.png',
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR_WAYRA', 'ADMIN_WAYRA_TALLER'],
    children: [
      { 
        title: 'Productos Wayra', 
        href: '/inventario/productos-wayra', 
        icon: Package,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS', 'VENDEDOR_WAYRA', 'ADMIN_WAYRA_TALLER']
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
        title: 'Contabilidad Wayra', 
        href: '/contabilidad/wayra-productos', 
        icon: DollarSign,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS']
      }
    ]
  },
  {
    title: 'TorniRepuestos',
    icon: Package,
    logo: '/images/TorniRepuestos.png',
    roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI', 'ADMIN_WAYRA_TALLER'],
    children: [
      { title: 'Repuestos', href: '/inventario/repuestos', icon: Car, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Filtros', href: '/inventario/filtros', icon: Filter, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Lubricantes', href: '/inventario/lubricantes', icon: Droplets, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Tornillería', href: '/inventario/tornilleria', icon: Bolt, roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI', 'ADMIN_WAYRA_TALLER'] },
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
        title: 'Contabilidad TorniRepuestos', 
        href: '/contabilidad/torni-repuestos', 
        icon: Briefcase,
        roles: ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS']
      }
    ]
  },
  {
    title: 'Wayra Taller',
    icon: Car,
    roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'],
    children: [
      { title: 'Órdenes Activas', href: '/ordenes', icon: ClipboardCheck, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'] },
      { title: 'Nueva Orden', href: '/ordenes/nueva', icon: Plus, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Historial', href: '/ordenes/historial', icon: History, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Clientes', href: '/clientes', icon: Users, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Vehículos', href: '/vehiculos', icon: Car, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Facturación', href: '/facturacion', icon: FileText, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Config. Servicios', href: '/taller/configuracion', icon: Settings, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'] },
      { title: 'Reportes Mecánicos', href: '/reportes/mecanicos', icon: PieChart, roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'] },
      { 
        title: 'Contabilidad Taller', 
        href: '/contabilidad/wayra-taller', 
        icon: Calculator,
        roles: ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER']
      }
    ]
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
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useState<HTMLButtonElement | null>(null)
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const isActive = item.href ? pathname === item.href : false
  const hasActiveChild = item.children?.some(child => 
    pathname.startsWith(child.href || '')
  )

  if (item.roles && !item.roles.includes(session?.user?.role || '')) {
    return null
  }

  const handleClick = () => {
    if (item.children) {
      setIsExpanded(!isExpanded)
      if (isCollapsed && buttonRef[0]) {
        const rect = buttonRef[0].getBoundingClientRect()
        setButtonRect(rect)
      }
    }
    if (onItemClick && !item.children) {
      onItemClick()
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (isCollapsed && !isExpanded) {
      const rect = e.currentTarget.getBoundingClientRect()
      setButtonRect(rect)
      setShowTooltip(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isExpanded) {
      setShowTooltip(false)
      setButtonRect(null)
    }
  }

  const handleChildClick = () => {
    setIsExpanded(false)
    setShowTooltip(false)
    setButtonRect(null)
    if (onItemClick) {
      onItemClick()
    }
  }

  if (item.children) {
    const visibleChildren = item.children.filter(child => 
      !child.roles || child.roles.includes(session?.user?.role || '')
    )

    if (visibleChildren.length === 0) {
      return null
    }

    return (
      <div className="space-y-1 relative">
        <button
          ref={(el) => buttonRef[0] = el}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden',
            level > 0 && 'ml-4',
            (hasActiveChild || isExpanded) 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
            isCollapsed && level === 0 && 'justify-center px-3'
          )}
        >
          <div className="flex items-center space-x-3 relative z-10">
            {item.logo ? (
              <div className={cn(
                "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
                (hasActiveChild || isExpanded) ? "bg-white/20" : "bg-blue-100"
              )}>
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
              "transition-transform duration-200 relative z-10",
              isExpanded ? "rotate-90" : ""
            )}>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            </div>
          )}
        </button>

        {isCollapsed && showTooltip && !isExpanded && buttonRect && typeof window !== 'undefined' && (
          <div 
            className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-xl pointer-events-none"
            style={{ 
              left: `${buttonRect.right + 12}px`,
              top: `${buttonRect.top + buttonRect.height / 2}px`,
              transform: 'translateY(-50%)'
            }}>
            {item.title}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}

        {isExpanded && !isCollapsed && (
          <div className="space-y-1 ml-6 border-l-2 border-blue-200 pl-4 animate-in slide-in-from-top-2 duration-200">
            {visibleChildren.map((child, index) => (
              <MenuItem key={index} item={child} level={level + 1} isCollapsed={isCollapsed} onItemClick={onItemClick} />
            ))}
          </div>
        )}

        {isCollapsed && isExpanded && buttonRect && typeof window !== 'undefined' && (
          <>
            <div 
              className="fixed inset-0 z-[9998]"
              onClick={() => {
                setIsExpanded(false)
                setShowTooltip(false)
                setButtonRect(null)
              }}
            />
            <div 
              className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl py-2 min-w-56 animate-in slide-in-from-left-2 duration-200"
              style={{ 
                left: `${buttonRect.right + 12}px`,
                top: `${buttonRect.top}px`
              }}>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-1">
                {item.title}
              </div>
              {visibleChildren.map((child, index) => (
                <Link
                  key={index}
                  href={child.href || '#'}
                  onClick={handleChildClick}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors mx-2 rounded-lg",
                    pathname === child.href
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  )}
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
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="font-medium">{child.title}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Link
        href={item.href || '#'}
        onClick={onItemClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden',
          level > 0 && 'ml-4',
          isActive 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
          isCollapsed && level === 0 && 'justify-center px-3'
        )}
      >
        <div className="flex items-center space-x-3 relative z-10">
          {item.logo ? (
            <div className={cn(
              "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
              isActive ? "bg-white/20" : "bg-blue-100"
            )}>
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
      </Link>

      {isCollapsed && showTooltip && buttonRect && typeof window !== 'undefined' && (
        <div 
          className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-xl pointer-events-none"
          style={{ 
            left: `${buttonRect.right + 12}px`,
            top: `${buttonRect.top + buttonRect.height / 2}px`,
            transform: 'translateY(-50%)'
          }}>
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
      case 'VENDEDOR_WAYRA': return 'Vendedor Wayra'
      case 'VENDEDOR_TORNI': return 'Vendedor TorniRepuestos'
      default: return role
    }
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={cn(
        'fixed inset-y-0 left-0 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30 shadow-xl',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-0',
        isCollapsed ? 'w-20' : 'w-72'
      )}>
        <div className={cn(
          'flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white',
          isCollapsed && 'px-3 justify-center'
        )}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Sistema Wayra
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <ChevronLeft className={cn(
                "h-5 w-5 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )} />
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          {menuItems.map((item, index) => (
            <MenuItem 
              key={index} 
              item={item} 
              isCollapsed={isCollapsed} 
              onItemClick={() => setIsOpen(false)}
            />
          ))}
        </nav>

        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="text-xs text-gray-500 text-center">
              <div className="font-semibold text-gray-700 mb-1">Sistema Wayra v1.0</div>
              <div className="text-gray-400">Fase 1 - {getRoleDisplayName(session?.user?.role || '')}</div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-left-2 {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
        
        .slide-in-from-left-2 {
          animation-name: slide-in-from-left-2;
        }
        
        .duration-200 {
          animation-duration: 200ms;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
        
        .hover\\:scrollbar-thumb-gray-400:hover::-webkit-scrollbar-thumb {
          background-color: rgb(156 163 175);
        }
      `}</style>
    </>
  )
}