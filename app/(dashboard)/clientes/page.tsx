'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Plus, Search, CreditCard as Edit, Trash2, User, Phone, Mail, MapPin, Car, FileText, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  tipoDocumento: string
  numeroDocumento?: string
  vehiculos: any[]
  _count: { ordenes: number }
  createdAt: string
}

interface ClienteForm {
  nombre: string
  telefono: string
  email: string
  direccion: string
  tipoDocumento: string
  numeroDocumento: string
}

export default function ClientesPage() {
  const { data: session } = useSession()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ClienteForm>()

  useEffect(() => {
    if (hasAccess) {
      fetchClientes()
    }
  }, [hasAccess])

  useEffect(() => {
    if (editingCliente) {
      setValue('nombre', editingCliente.nombre)
      setValue('telefono', editingCliente.telefono || '')
      setValue('email', editingCliente.email || '')
      setValue('direccion', editingCliente.direccion || '')
      setValue('tipoDocumento', editingCliente.tipoDocumento)
      setValue('numeroDocumento', editingCliente.numeroDocumento || '')
    }
  }, [editingCliente, setValue])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      } else {
        toast.error('Error al cargar clientes')
      }
    } catch (error) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ClienteForm) => {
    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes'
      const method = editingCliente ? 'PATCH' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente creado exitosamente')
        fetchClientes()
        handleCloseModal()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar cliente')
      }
    } catch (error) {
      toast.error('Error al guardar cliente')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    reset()
  }

  const deleteCliente = async (clienteId: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return

    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Cliente eliminado correctamente')
        fetchClientes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar cliente')
      }
    } catch (error) {
      toast.error('Error al eliminar cliente')
    }
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-105">
              <User className="h-6 sm:h-10 w-6 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestión de Clientes</h1>
              <p className="text-blue-100 text-base sm:text-lg">Administra la información de clientes</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg w-full sm:w-auto transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50 transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar clientes por nombre, teléfono, email o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-0 bg-white shadow-md focus:shadow-lg transition-all duration-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clientes List */}
      <Card className="shadow-xl border-0 bg-white transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-gray-800">
            Clientes Registrados ({filteredClientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto max-h-[60vh] transition-all duration-300">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Contacto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Documento</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Vehículos</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Órdenes</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente, index) => (
                  <tr 
                    key={cliente.id} 
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500">
                            Cliente desde {new Date(cliente.createdAt).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {cliente.telefono && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{cliente.telefono}</span>
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{cliente.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="font-medium">{cliente.tipoDocumento}</div>
                        {cliente.numeroDocumento && (
                          <div className="text-gray-500">{cliente.numeroDocumento}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-green-100 text-green-700">
                        {cliente.vehiculos.length} vehículos
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-blue-100 text-blue-700">
                        {cliente._count.ordenes} órdenes
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCliente(cliente)
                            setShowModal(true)
                          }}
                          className="hover:bg-blue-50 transition-all duration-300 hover:scale-110"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCliente(cliente.id)}
                          className="hover:bg-red-50 text-red-600 transition-all duration-300 hover:scale-110"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4 overflow-y-auto max-h-[60vh] transition-all duration-300">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="shadow-md transition-all duration-300 hover:shadow-lg hover:scale-102">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-900">{cliente.nombre}</div>
                      <div className="text-sm text-gray-500 mb-2">
                        Cliente desde {new Date(cliente.createdAt).toLocaleDateString('es-CO')}
                      </div>
                      <div className="space-y-2 text-sm">
                        {cliente.telefono && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{cliente.telefono}</span>
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{cliente.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{cliente.tipoDocumento} {cliente.numeroDocumento || ''}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <Badge className="bg-green-100 text-green-700">
                            {cliente.vehiculos.length} vehículos
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <Badge className="bg-blue-100 text-blue-700">
                            {cliente._count.ordenes} órdenes
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCliente(cliente)
                          setShowModal(true)
                        }}
                        className="hover:bg-blue-50 transition-all duration-300 hover:scale-110"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCliente(cliente.id)}
                        className="hover:bg-red-50 text-red-600 transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredClientes.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-105">
                <User className="h-12 w-12 text-blue-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">No se encontraron clientes</div>
              <p className="text-gray-400 mt-2">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Registra el primer cliente'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <Input
              {...register('nombre', { required: 'El nombre es requerido' })}
              placeholder="Nombre del cliente"
              className={`${errors.nombre ? 'border-red-500' : ''} transition-all duration-300 focus:scale-102`}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento
              </label>
              <select
                {...register('tipoDocumento')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 focus:scale-102"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="PP">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento
              </label>
              <Input
                {...register('numeroDocumento')}
                placeholder="Número de documento"
                className="transition-all duration-300 focus:scale-102"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <Input
                {...register('telefono')}
                placeholder="Número de teléfono"
                className="transition-all duration-300 focus:scale-102"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="correo@ejemplo.com"
                className="transition-all duration-300 focus:scale-102"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <Input
              {...register('direccion')}
              placeholder="Dirección completa"
              className="transition-all duration-300 focus:scale-102"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal} className="transition-all duration-300 hover:scale-105">
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105">
              {editingCliente ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}