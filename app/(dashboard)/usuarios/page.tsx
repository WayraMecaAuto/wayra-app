'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserModal } from '@/components/usuarios/CreateUserModal'
import { EditUserModal } from '@/components/usuarios/EditUserModal'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filterStatus, setFilterStatus] = useState<'todos' | 'activos' | 'inactivos'>('todos')

  // Solo SUPER_USUARIO puede acceder
  if (session?.user?.role !== 'SUPER_USUARIO') {
    redirect('/dashboard')
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/usuarios')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('Error al cargar usuarios')
      }
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? 'activar' : 'desactivar'
    
    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      
      if (response.ok) {
        toast.success(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`)
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      toast.error('Error al actualizar usuario')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este usuario? Esta acción no se puede deshacer. Si solo quieres desactivarlo, usa el botón de desactivar.')) {
      return
    }

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Usuario eliminado permanentemente')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_USUARIO': return 'bg-blue-500 text-white hover:bg-blue-800'
      case 'ADMIN_WAYRA_TALLER': return 'bg-gray-400 text-white hover:bg-gray-600'
      case 'ADMIN_WAYRA_PRODUCTOS': return 'bg-purple-500 text-white hover:bg-purple-800'
      case 'ADMIN_TORNI_REPUESTOS': return 'bg-indigo-500 text-white hover:bg-indigo-800'
      case 'MECANICO': return 'bg-slate-500 text-white hover:bg-slate-800'
      case 'VENDEDOR_WAYRA': return 'bg-cyan-500 text-white hover:bg-cyan-700'
      case 'VENDEDOR_TORNI': return 'bg-sky-500 text-white hover:bg-sky-700'
      default: return 'bg-gray-500 text-white hover:bg-blue-800'
    }
  }

  // Filtrar usuarios por búsqueda y estado
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'todos' || 
      (filterStatus === 'activos' && user.isActive) ||
      (filterStatus === 'inactivos' && !user.isActive)
    
    return matchesSearch && matchesStatus
  })

  const activeUsers = users.filter(u => u.isActive).length
  const inactiveUsers = users.filter(u => !u.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header with animation */}
        <div className="animate-fade-in-down">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
                  Gestión de Usuarios
                </h1>
              </div>
              <p className="text-slate-600 ml-14">Administra y controla los usuarios del sistema</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-lg px-6 py-6 group"
            >
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Usuarios</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{users.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{activeUsers}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Usuarios Inactivos</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{inactiveUsers}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white border-0 shadow-lg animate-fade-in">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterStatus('todos')}
                variant={filterStatus === 'todos' ? 'default' : 'outline'}
                className={`${filterStatus === 'todos' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                Todos ({users.length})
              </Button>
              <Button
                onClick={() => setFilterStatus('activos')}
                variant={filterStatus === 'activos' ? 'default' : 'outline'}
                className={`${filterStatus === 'activos' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                Activos ({activeUsers})
              </Button>
              <Button
                onClick={() => setFilterStatus('inactivos')}
                variant={filterStatus === 'inactivos' ? 'default' : 'outline'}
                className={`${filterStatus === 'inactivos' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Inactivos ({inactiveUsers})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border-0 shadow-xl animate-fade-in-up overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuarios ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="block sm:hidden">
              {filteredUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className={`p-4 border-b border-slate-100 transition-all duration-300 animate-slide-in-right ${
                    !user.isActive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${
                        user.isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:scale-110' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute inset-0 rounded-full blur-lg opacity-0 transition-opacity duration-300 ${
                        user.isActive ? 'group-hover:opacity-50 bg-blue-400' : ''
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${getRoleBadgeColor(user.role)} rounded-full px-3 py-1 shadow-sm`}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                    <Badge 
                      className={`rounded-full px-3 py-1 shadow-sm ${
                        user.isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                    Último acceso: {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('es-CO')
                      : 'Nunca'
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setEditingUser(user)}
                      className="flex-1 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {user.isActive ? (
                      <Button
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, false)}
                        className="flex-1 bg-white border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all duration-300"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, true)}
                        className="flex-1 bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Usuario</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Rol</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Estado</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Último Acceso</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`border-b border-slate-100 transition-all duration-300 animate-slide-in-right group ${
                        !user.isActive ? 'bg-gray-50 opacity-75' : 'hover:bg-blue-50'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                              user.isActive 
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:shadow-lg group-hover:scale-110' 
                                : 'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                              <span className="text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className={`absolute inset-0 rounded-full blur-md opacity-0 transition-opacity duration-300 ${
                              user.isActive ? 'group-hover:opacity-40 bg-blue-400' : ''
                            }`}></div>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${getRoleBadgeColor(user.role)} rounded-full px-3 py-1 shadow-sm hover:shadow-md transition-shadow duration-300`}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          className={`rounded-full px-3 py-1 shadow-sm hover:shadow-md transition-all duration-300 ${
                            user.isActive 
                              ? 'bg-green-500 text-white hover:bg-green-700' 
                              : 'bg-red-500 text-white hover:bg-red-700'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Nunca'
                          }
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, false)}
                              className="bg-white border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Desactivar usuario"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, true)}
                              className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Reactivar usuario"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            className="bg-white border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            title="Eliminar usuario permanentemente"
                            disabled={session?.user?.id === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <div className="text-slate-600 text-lg font-medium">No se encontraron usuarios</div>
                <p className="text-slate-400 mt-2">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea el primer usuario del sistema'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
        />

        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchUsers}
          user={editingUser}
        />
      </div>

      <style jsx global>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out 0.4s both;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out both;
        }
      `}</style>
    </div>
  )
}