'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Car, User, FileText, Gauge, Calendar, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  anio?: number  // ✅ Cambiado de año a anio
  color?: string
  vin?: string
  motor?: string
  combustible?: string
  kilometraje?: number
  observaciones?: string
  clienteId: string
  cliente: {
    nombre: string
  }
  _count: { ordenes: number }
  createdAt: string
}

interface Cliente {
  id: string
  nombre: string
}

interface VehiculoForm {
  clienteId: string
  placa: string
  marca: string
  modelo: string
  anio: string  // ✅ Cambiado de año a anio
  color: string
  vin: string
  motor: string
  combustible: string
  kilometraje: string
  observaciones: string
}

export default function VehiculosPage() {
  const { data: session } = useSession()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<VehiculoForm>()

  useEffect(() => {
    if (hasAccess) {
      fetchVehiculos()
      fetchClientes()
    }
  }, [hasAccess])

  useEffect(() => {
    if (editingVehiculo) {
      setValue('clienteId', editingVehiculo.clienteId)
      setValue('placa', editingVehiculo.placa)
      setValue('marca', editingVehiculo.marca)
      setValue('modelo', editingVehiculo.modelo)
      setValue('anio', editingVehiculo.anio?.toString() || '')  // ✅ Cambiado de año a anio
      setValue('color', editingVehiculo.color || '')
      setValue('vin', editingVehiculo.vin || '')
      setValue('motor', editingVehiculo.motor || '')
      setValue('combustible', editingVehiculo.combustible || '')
      setValue('kilometraje', editingVehiculo.kilometraje?.toString() || '')
      setValue('observaciones', editingVehiculo.observaciones || '')
    }
  }, [editingVehiculo, setValue])

  const fetchVehiculos = async () => {
    try {
      const response = await fetch('/api/vehiculos')
      if (response.ok) {
        const data = await response.json()
        setVehiculos(data)
      } else {
        toast.error('Error al cargar vehículos')
      }
    } catch (error) {
      toast.error('Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const onSubmit = async (data: VehiculoForm) => {
    try {
      const url = editingVehiculo ? `/api/vehiculos/${editingVehiculo.id}` : '/api/vehiculos'
      const method = editingVehiculo ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success(editingVehiculo ? 'Vehículo actualizado' : 'Vehículo creado exitosamente')
        fetchVehiculos()
        handleCloseModal()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar vehículo')
      }
    } catch (error) {
      toast.error('Error al guardar vehículo')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingVehiculo(null)
    reset()
  }

  const deleteVehiculo = async (vehiculoId: string) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return

    try {
      const response = await fetch(`/api/vehiculos/${vehiculoId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Vehículo eliminado correctamente')
        fetchVehiculos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar vehículo')
      }
    } catch (error) {
      toast.error('Error al eliminar vehículo')
    }
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  const filteredVehiculos = vehiculos.filter(vehiculo =>
    vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehiculo.vin?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Car className="h-6 sm:h-10 w-6 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestión de Vehículos</h1>
              <p className="text-indigo-100 text-base sm:text-lg">Administra el inventario de vehículos</p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar vehículos por placa, marca, modelo, cliente o VIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-0 bg-white shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehiculos Table */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl text-gray-800">
            Vehículos Registrados ({filteredVehiculos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Vehículo</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Propietario</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Detalles</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Órdenes</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehiculos.map((vehiculo, index) => (
                  <tr 
                    key={vehiculo.id} 
                    className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{vehiculo.placa}</div>
                          <div className="text-sm text-gray-600">
                            {vehiculo.marca} {vehiculo.modelo}
                          </div>
                          {vehiculo.anio && (  // ✅ Cambiado de año a anio
                            <div className="text-xs text-gray-500">Año {vehiculo.anio}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{vehiculo.cliente.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-sm">
                        {vehiculo.color && (
                          <div className="flex items-center space-x-2">
                            <Palette className="h-4 w-4 text-gray-400" />
                            <span>{vehiculo.color}</span>
                          </div>
                        )}
                        {vehiculo.combustible && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{vehiculo.combustible}</span>
                          </div>
                        )}
                        {vehiculo.kilometraje && (
                          <div className="flex items-center space-x-2">
                            <Gauge className="h-4 w-4 text-gray-400" />
                            <span>{vehiculo.kilometraje.toLocaleString()} km</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-blue-100 text-blue-700">
                        {vehiculo._count.ordenes} órdenes
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVehiculo(vehiculo)
                            setShowModal(true)
                          }}
                          className="hover:bg-indigo-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteVehiculo(vehiculo.id)}
                          className="hover:bg-red-50 text-red-600"
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
          
          {filteredVehiculos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="h-12 w-12 text-indigo-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">No se encontraron vehículos</div>
              <p className="text-gray-400 mt-2">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Registra el primer vehículo'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
        title={editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              {...register('clienteId', { required: 'El cliente es requerido' })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.clienteId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={!!editingVehiculo}
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            {errors.clienteId && (
              <p className="mt-1 text-sm text-red-600">{errors.clienteId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placa *
              </label>
              <Input
                {...register('placa', { required: 'La placa es requerida' })}
                placeholder="ABC123"
                className={errors.placa ? 'border-red-500' : ''}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.placa && (
                <p className="mt-1 text-sm text-red-600">{errors.placa.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <Input
                {...register('anio')}  // ✅ Cambiado de año a anio
                type="number"
                placeholder="2024"
                min="1900"
                max="2100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca *
              </label>
              <Input
                {...register('marca', { required: 'La marca es requerida' })}
                placeholder="Toyota"
                className={errors.marca ? 'border-red-500' : ''}
              />
              {errors.marca && (
                <p className="mt-1 text-sm text-red-600">{errors.marca.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo *
              </label>
              <Input
                {...register('modelo', { required: 'El modelo es requerido' })}
                placeholder="Corolla"
                className={errors.modelo ? 'border-red-500' : ''}
              />
              {errors.modelo && (
                <p className="mt-1 text-sm text-red-600">{errors.modelo.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <Input
                {...register('color')}
                placeholder="Blanco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Combustible
              </label>
              <select
                {...register('combustible')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Gas">Gas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIN
              </label>
              <Input
                {...register('vin')}
                placeholder="Número de serie del vehículo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motor
              </label>
              <Input
                {...register('motor')}
                placeholder="Número de motor"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kilometraje
            </label>
            <Input
              {...register('kilometraje')}
              type="number"
              placeholder="150000"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              placeholder="Notas adicionales sobre el vehículo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              {editingVehiculo ? 'Actualizar' : 'Crear'} Vehículo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}