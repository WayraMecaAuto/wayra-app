'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Bell, User, LogOut, Settings, Shield, Clock, X, CheckCircle, AlertTriangle, Info, Check, AreaChart as MarkAsUnread, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: string
  category: string
  priority: string
  read: boolean
  data?: any
}

// Componente Modal separado para usar con portal
function NotificationsModal({ 
  showModal, 
  onClose, 
  notifications, 
  unreadCount, 
  markAsRead, 
  markAllAsRead, 
  getNotificationIcon, 
  getNotificationColor 
}: {
  showModal: boolean
  onClose: () => void
  notifications: Notification[]
  unreadCount: number
  markAsRead: (ids: string[]) => void
  markAllAsRead: () => void
  getNotificationIcon: (type: string) => JSX.Element
  getNotificationColor: (type: string, priority: string, read: boolean) => string
}) {
  // Efecto para manejar scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  // Efecto para cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showModal, onClose])

  if (!showModal || typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="relative z-10 w-full h-full sm:h-auto flex items-center justify-center">
        <div 
          className="bg-white w-full h-full sm:w-auto sm:h-auto sm:rounded-2xl shadow-2xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl sm:max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 sm:rounded-t-2xl flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 id="modal-title" className="font-bold text-gray-900 text-base sm:text-xl lg:text-2xl truncate">
                Centro de Notificaciones
              </h3>
              <p className="text-xs sm:text-base text-gray-600 mt-1 hidden sm:block">
                Gestiona todas las notificaciones del sistema
              </p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3 ml-2 sm:ml-4">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="hover:bg-blue-50 touch-manipulation text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3"
                >
                  <MarkAsUnread className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline sm:inline">Marcar todas</span>
                  <span className="xs:hidden sm:hidden">✓</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-white/50 touch-manipulation flex-shrink-0 p-1 sm:p-2"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div 
            className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 min-h-0"
          >
            {notifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-2 sm:p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer touch-manipulation group",
                      getNotificationColor(notification.type, notification.priority, notification.read)
                    )}
                    onClick={() => markAsRead([notification.id])}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1">
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 flex-1 group-hover:text-gray-700 transition-colors">
                            {notification.title}
                          </h4>
                          {notification.read && (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3 group-hover:text-gray-500 transition-colors">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-white/50 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium capitalize truncate max-w-16 sm:max-w-none">
                            {notification.category}
                          </span>
                          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-500 font-medium">
                              {notification.time}
                            </span>
                            {notification.priority === 'high' && (
                              <span className="text-xs bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                                <span className="hidden sm:inline">Urgente</span>
                                <span className="sm:hidden">!</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-16 lg:py-20">
                <Bell className="h-12 w-12 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-xl lg:text-2xl font-medium text-gray-500 mb-2">
                  No hay notificaciones
                </h4>
                <p className="text-sm sm:text-base text-gray-400">
                  Todas las notificaciones aparecerán aquí
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 sm:p-6 lg:p-8 border-t border-gray-100 bg-gray-50 sm:rounded-b-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-base text-gray-600">
                <span className="font-medium">{notifications.length}</span> notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {unreadCount} sin leer
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="touch-manipulation text-xs sm:text-sm px-3 sm:px-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchNotifications()
    // Cargar notificaciones leídas del localStorage
    const savedReadNotifications = localStorage.getItem('readNotifications')
    if (savedReadNotifications) {
      setReadNotifications(new Set(JSON.parse(savedReadNotifications)))
    }
    
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Guardar notificaciones leídas en localStorage cuando cambien
  useEffect(() => {
    if (readNotifications.size > 0) {
      localStorage.setItem('readNotifications', JSON.stringify(Array.from(readNotifications)))
    }
  }, [readNotifications])

  const fetchNotifications = async () => {
    try {
      // Enviar las notificaciones leídas al servidor para que las marque correctamente
      const readNotificationsArray = Array.from(readNotifications)
      const queryParams = new URLSearchParams({
        readNotifications: JSON.stringify(readNotificationsArray)
      })
      
      const response = await fetch(`/api/notifications?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        // Las notificaciones ya vienen con el estado correcto desde el servidor
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, action: 'mark_read' })
      })
      
      if (response.ok) {
        // Actualizar estado local
        const newReadNotifications = new Set([...readNotifications, ...notificationIds])
        setReadNotifications(newReadNotifications)
        
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, read: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      try {
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: unreadIds, action: 'mark_read' })
        })
        
        if (response.ok) {
          // Actualizar estado local
          const newReadNotifications = new Set([...readNotifications, ...unreadIds])
          setReadNotifications(newReadNotifications)
          
          setNotifications(prev => 
            prev.map(notif => 
              unreadIds.includes(notif.id) 
                ? { ...notif, read: true }
                : notif
            )
          )
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string, priority: string, read: boolean) => {
    const baseOpacity = read ? 'opacity-60' : ''
    
    if (priority === 'high') {
      return `bg-red-50 border-red-200 hover:bg-red-100 ${baseOpacity}`
    }
    switch (type) {
      case 'warning': return `bg-yellow-50 border-yellow-200 hover:bg-yellow-100 ${baseOpacity}`
      case 'success': return `bg-green-50 border-green-200 hover:bg-green-100 ${baseOpacity}`
      case 'info': return `bg-blue-50 border-blue-200 hover:bg-blue-100 ${baseOpacity}`
      default: return `bg-gray-50 border-gray-200 hover:bg-gray-100 ${baseOpacity}`
    }
  }

  const handleCloseAllNotifications = () => {
    setShowAllNotifications(false)
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

  const unreadCount = notifications.filter(n => !n.read).length
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length

  return (
    <>
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-900/5 sticky top-0 z-40">
        <div className="flex items-center justify-between h-full px-4 sm:px-8">
          {/* Left side */}
          <div className="flex items-center space-x-3 sm:space-x-8">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 sm:p-3 rounded-lg sm:rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 touch-manipulation"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Logos - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-6">
              <div className="flex items-center space-x-2 sm:space-x-4 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl border border-blue-200/50 shadow-md">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/images/WayraLogo.png"
                    alt="Wayra Logo"
                    width={32}
                    height={32}
                    className="object-contain sm:w-10 sm:h-10"
                  />
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center">
                  <Image
                    src="/images/TorniRepuestos.png"
                    alt="TorniRepuestos Logo"
                    width={32}
                    height={32}
                    className="object-contain sm:w-10 sm:h-10"
                  />
                </div>
              </div>

              {/* Status del taller - Solo visible en desktop */}
              <div className="hidden lg:flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200/50 shadow-md">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {isWorkingHours() ? (
                    <span className="text-green-600 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Taller Abierto
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Taller Cerrado
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications - Optimizado para móvil */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 sm:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 touch-manipulation"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-bounce font-bold",
                    highPriorityCount > 0 ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-blue-500 to-blue-600"
                  )}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Menu desplegable - Responsive */}
              {showNotifications && (
                <div className="absolute -right-full mt-2 sm:mt-3 w-80 sm:w-96 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 z-50 animate-scale-in max-h-[80vh] overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">Notificaciones</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Últimas actualizaciones del sistema</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium hover:bg-blue-200 transition-colors touch-manipulation"
                          >
                            Marcar todas
                          </button>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {notifications.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 sm:p-4 border-b border-gray-50 transition-colors cursor-pointer relative touch-manipulation",
                            getNotificationColor(notification.type, notification.priority, notification.read)
                          )}
                          onClick={() => markAsRead([notification.id])}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{notification.title}</h4>
                              <p className="text-xs mt-1 text-gray-600 line-clamp-2">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 font-medium">{notification.time}</span>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  {notification.priority === 'high' && (
                                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                      Urgente
                                    </span>
                                  )}
                                  {notification.read && (
                                    <Check className="h-3 w-3 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 sm:p-8 text-center">
                        <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No hay notificaciones</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
                    <button 
                      onClick={() => {
                        setShowAllNotifications(true)
                        setShowNotifications(false)
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                    >
                      Ver todas ({notifications.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Usuario Menu - Optimizado para móvil */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 sm:space-x-4 p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-all duration-200 touch-manipulation"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold text-gray-900 truncate max-w-24 lg:max-w-none">
                    {session?.user?.name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize font-medium">
                    {(() => {
                      switch(session?.user?.role) {
                        case 'SUPER_USUARIO': return 'Super Usuario'
                        case 'ADMIN_WAYRA_TALLER': return 'Admin Taller'
                        case 'ADMIN_WAYRA_PRODUCTOS': return 'Admin Productos'
                        case 'ADMIN_TORNI_REPUESTOS': return 'Admin Repuestos'
                        case 'MECANICO': return 'Mecánico'
                        case 'VENDEDOR_WAYRA': return 'Vendedor Wayra'
                        case 'VENDEDOR_TORNI': return 'Vendedor TorniRepuestos'
                        default: return 'Usuario'
                      }
                    })()}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
              </button>

              {/* Usuario menu desplegable - Responsive */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 sm:mt-3 w-56 sm:w-64 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 z-50 animate-scale-in">
                  <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-base">
                          {session?.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          {session?.user?.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>Mi Perfil</span>
                    </button>
                    
                    {['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '') && (
                      <button className="w-full flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation">
                        <Shield className="h-4 w-4 flex-shrink-0" />
                        <span>Administración</span>
                      </button>
                    )}
                    
                    <button className="w-full flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation">
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      <span>Configuración</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center space-x-3 px-4 sm:px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click outside to close dropdowns */}
        {(showUserMenu || showNotifications) && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => {
              setShowUserMenu(false)
              setShowNotifications(false)
            }}
          />
        )}
      </header>

      {/* Modal de todas las notificaciones usando Portal */}
      <NotificationsModal
        showModal={showAllNotifications}
        onClose={handleCloseAllNotifications}
        notifications={notifications}
        unreadCount={unreadCount}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
      />
    </>
  )
}