'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Bell, LogOut, Clock, X, CheckCircle, AlertTriangle, Info, Check, ChevronDown, Filter, Loader2, Archive, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Dropdown from '@/components/forms/Dropdown'

interface NavbarProps {
  onMenuClick: () => void
}

interface Notification {
  id: string
  notificacionId: string
  title: string
  message: string
  time: string
  type: string
  category: string
  priority: string
  read: boolean
  fecha: Date
  data?: any
}

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
]

function NotificationsModal({ 
  showModal, 
  onClose, 
  notifications, 
  markAsRead, 
  markAsUnread,
  markAllAsRead, 
  archiveNotifications,
  mesFilter,
  añoFilter,
  onFilterChange,
  isLoading
}: {
  showModal: boolean
  onClose: () => void
  notifications: Notification[]
  markAsRead: (ids: string[]) => void
  markAsUnread: (ids: string[]) => void
  markAllAsRead: () => void
  archiveNotifications: (ids: string[]) => void
  mesFilter: string
  añoFilter: string
  onFilterChange: (mes: string, año: string) => void
  isLoading: boolean
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [localMes, setLocalMes] = useState(mesFilter)
  const [localAño, setLocalAño] = useState(añoFilter)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  useEffect(() => {
    setLocalMes(mesFilter)
    setLocalAño(añoFilter)
  }, [mesFilter, añoFilter])

  if (!showModal || typeof window === 'undefined') return null

  const unreadCount = notifications.filter(n => !n.read).length
  const selectedCount = selectedNotifications.size

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedNotifications)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedNotifications(newSet)
  }

  const selectAll = () => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)))
  }

  const clearSelection = () => {
    setSelectedNotifications(new Set())
  }

  const handleBulkAction = (action: 'read' | 'unread' | 'archive') => {
    const ids = Array.from(selectedNotifications)
    if (action === 'read') markAsRead(ids)
    else if (action === 'unread') markAsUnread(ids)
    else if (action === 'archive') archiveNotifications(ids)
    clearSelection()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string, priority: string, read: boolean) => {
    const baseOpacity = read ? 'opacity-70' : ''
    if (priority === 'high') return `bg-red-50 border-red-200 hover:bg-red-100 ${baseOpacity}`
    switch (type) {
      case 'warning': return `bg-yellow-50 border-yellow-200 hover:bg-yellow-100 ${baseOpacity}`
      case 'success': return `bg-green-50 border-green-200 hover:bg-green-100 ${baseOpacity}`
      case 'info': return `bg-blue-50 border-blue-200 hover:bg-blue-100 ${baseOpacity}`
      case 'error': return `bg-red-50 border-red-200 hover:bg-red-100 ${baseOpacity}`
      default: return `bg-gray-50 border-gray-200 hover:bg-gray-100 ${baseOpacity}`
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 bg-white w-full h-full sm:w-auto sm:h-auto sm:rounded-2xl shadow-2xl sm:max-w-6xl sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg sm:text-2xl">Centro de Notificaciones</h3>
            <p className="text-sm text-gray-600 mt-1">
              <span className="text-blue-600 font-medium">
                {MESES.find(m => m.value === mesFilter)?.label} {añoFilter}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-50 border-blue-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Marcar todas
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Mes</label>
                <Dropdown
                  options={MESES}
                  value={localMes}
                  onChange={setLocalMes}
                  placeholder="Seleccionar mes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Año</label>
                <Dropdown
                  options={years}
                  value={localAño}
                  onChange={setLocalAño}
                  placeholder="Seleccionar año"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={() => {
                    onFilterChange(localMes, localAño)
                    setShowFilters(false)
                  }} 
                  className="flex-1"
                >
                  Aplicar
                </Button>
                <Button 
                  onClick={() => {
                    const now = new Date()
                    const mes = String(now.getMonth() + 1)
                    const año = String(now.getFullYear())
                    setLocalMes(mes)
                    setLocalAño(año)
                    onFilterChange(mes, año)
                    setShowFilters(false)
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  Hoy
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones en masa */}
        {selectedCount > 0 && (
          <div className="p-3 bg-blue-50 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} seleccionada{selectedCount > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('read')}>
                <Check className="h-4 w-4 mr-1" />
                Marcar leídas
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('unread')}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Marcar no leídas
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                <Archive className="h-4 w-4 mr-1" />
                Archivar
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-500">Cargando notificaciones...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all hover:shadow-md relative",
                    getNotificationColor(n.type, n.priority, n.read),
                    selectedNotifications.has(n.id) && "ring-2 ring-blue-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(n.id)}
                      onChange={() => toggleSelection(n.id)}
                      className="mt-1 rounded"
                    />
                    <div className="mt-1">{getNotificationIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm line-clamp-2">{n.title}</h4>
                        {n.read && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 mb-2">{n.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-white/50 px-2 py-1 rounded-full font-medium capitalize">
                          {n.category === 'stock' ? 'Stock' :
                           n.category === 'inventory' ? 'Inventario' :
                           n.category === 'orders' ? 'Órdenes' :
                           n.category === 'users' ? 'Usuarios' :
                           n.category === 'billing' ? 'Facturación' : n.category}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">{n.time}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {!n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead([n.id])
                            }}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Marcar leída
                          </button>
                        )}
                        {n.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsUnread([n.id])
                            }}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            No leída
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            archiveNotifications([n.id])
                          }}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          Archivar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Bell className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-gray-500 mb-2">No hay notificaciones</h4>
              <p className="text-gray-400">
                No hay notificaciones para este período
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{notifications.length}</span> notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600 font-medium">• {unreadCount} sin leer</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedCount === 0 && notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Seleccionar todas
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
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
  const [isLoading, setIsLoading] = useState(false)
  
  const now = new Date()
  const [mesFilter, setMesFilter] = useState(String(now.getMonth() + 1))
  const [añoFilter, setAñoFilter] = useState(String(now.getFullYear()))

  const fetchNotifications = async (mes: string, año: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('mes', mes)
      params.append('año', año)
      
      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(mesFilter, añoFilter)
    const interval = setInterval(() => fetchNotifications(mesFilter, añoFilter), 60000)
    return () => clearInterval(interval)
  }, [mesFilter, añoFilter])

  const markAsRead = async (ids: string[]) => {
    if (!ids.length) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids, action: 'mark_read' })
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          ids.includes(n.id) ? { ...n, read: true } : n
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAsUnread = async (ids: string[]) => {
    if (!ids.length) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids, action: 'mark_unread' })
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          ids.includes(n.id) ? { ...n, read: false } : n
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    markAsRead(unreadIds)
  }

  const archiveNotifications = async (ids: string[]) => {
    if (!ids.length) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids, action: 'archive' })
      })
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => !ids.includes(n.id)))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string, priority: string, read: boolean) => {
    const opacity = read ? 'opacity-70' : ''
    if (priority === 'high') return `bg-red-50 border-red-200 ${opacity}`
    switch (type) {
      case 'warning': return `bg-yellow-50 border-yellow-200 ${opacity}`
      case 'success': return `bg-green-50 border-green-200 ${opacity}`
      case 'info': return `bg-blue-50 border-blue-200 ${opacity}`
      default: return `bg-gray-50 border-gray-200 ${opacity}`
    }
  }

  const isWorkingHours = () => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    const min = now.getMinutes()
    
    if (day === 0) return false
    if (day === 6) return (hour >= 8 && hour < 12) || (hour === 12 && min <= 30)
    
    const morning = (hour >= 8 && hour < 12) || (hour === 12 && min <= 30)
    const afternoon = hour >= 14 && hour < 18
    return morning || afternoon
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-xl border-b shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between h-full px-4 sm:px-8">
          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border shadow-md">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold">
                {isWorkingHours() ? (
                  <span className="text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Taller Abierto
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                    Taller Cerrado
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">Notificaciones</h3>
                          <p className="text-xs text-gray-600">
                            {MESES.find(m => m.value === mesFilter)?.label} {añoFilter}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markAllAsRead()
                            }}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200"
                          >
                            Marcar todas
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={cn("p-3 border-b cursor-pointer", getNotificationColor(n.type, n.priority, n.read))}
                          onClick={() => {
                            markAsRead([n.id])
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getNotificationIcon(n.type)}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm line-clamp-1">{n.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">{n.message}</p>
                              <span className="text-xs text-gray-500 mt-1 block">{n.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 border-t bg-gray-50 rounded-b-xl">
                      <button 
                        onClick={() => {
                          setShowAllNotifications(true)
                          setShowNotifications(false)
                        }}
                        className="w-full text-center text-sm text-blue-600 font-semibold py-2 hover:bg-blue-50 rounded-lg"
                      >
                        Ver todas ({notifications.length})
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Usuario */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-bold truncate max-w-32">{session?.user?.name}</div>
                  <div className="text-xs text-gray-500">{session?.user?.role?.replace(/_/g, ' ')}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{session?.user?.name}</div>
                          <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationsModal
        showModal={showAllNotifications}
        onClose={() => setShowAllNotifications(false)}
        notifications={notifications}
        markAsRead={markAsRead}
        markAsUnread={markAsUnread}
        markAllAsRead={markAllAsRead}
        archiveNotifications={archiveNotifications}
        mesFilter={mesFilter}
        añoFilter={añoFilter}
        onFilterChange={(mes, año) => {
          setMesFilter(mes)
          setAñoFilter(año)
        }}
        isLoading={isLoading}
      />
    </>
  )
}