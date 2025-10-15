'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface EditOrdenForm {
  descripcion: string
  mecanicoId: string
  manoDeObra: string
}

interface ServicioEditable {
  id?: string
  clave?: string
  descripcion: string
  precio: number
  isNew?: boolean
}

export default function EditOrdenPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [orden, setOrden] = useState<any>(null)
  const [mecanicos, setMecanicos] = useState<any[]>([])
  const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([])
  const [serviciosOrden, setServiciosOrden] = useState<ServicioEditable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const canEdit = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')
  const canEditServicios = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
  const isMecanico = session?.user?.role === 'MECANICO'

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditOrdenForm>()

  useEffect(() => {
    if (params.id) {
      fetchOrden()
      fetchMecanicos()
      fetchServicios()
    }
  }, [params.id])

  const fetchOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrden(data)
        setValue('descripcion', data.descripcion)
        setValue('mecanicoId', data.mecanicoId)
        setValue('manoDeObra', data.manoDeObra?.toString() || '0')
        
        // Cargar servicios existentes
        setServiciosOrden(data.servicios.map((s: any) => ({
          id: s.id,
          descripcion: s.descripcion,
          precio: s.precio,
          isNew: false
        })))
      } else {
        toast.error('Error al cargar orden')
      }
    } catch (error) {
      toast.error('Error al cargar orden')
    } finally {
      setLoading(false)
    }
  }

  const fetchMecanicos = async () => {
    try {
      const response = await fetch('/api/mecanicos')
      if (response.ok) {
        const data = await response.json()
        setMecanicos(data)
      }
    } catch (error) {
      console.error('Error fetching mecánicos:', error)
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios-taller')
      if (response.ok) {
        const data = await response.json()
        setServiciosDisponibles(data)
      }
    } catch (error) {
      console.error('Error fetching servicios:', error)
    }
  }

  const agregarServicio = (servicio: any) => {
    const nuevoServicio: ServicioEditable = {
      clave: servicio.clave,
      descripcion: servicio.descripcion,
      precio: parseFloat(servicio.valor),
      isNew: true
    }
    setServiciosOrden([...serviciosOrden, nuevoServicio])
    toast.success('Servicio agregado')
  }

  const removerServicio = (index: number) => {
    setServiciosOrden(serviciosOrden.filter((_, i) => i !== index))
    toast.success('Servicio removido')
  }

  const actualizarPrecioServicio = (index: number, nuevoPrecio: number) => {
    const nuevosServicios = [...serviciosOrden]
    nuevosServicios[index].precio = nuevoPrecio
    setServiciosOrden(nuevosServicios)
  }

  const calcularTotalServicios = () => {
    return serviciosOrden.reduce((sum, s) => sum + s.precio, 0)
  }

  const onSubmit = async (data: EditOrdenForm) => {
    setSaving(true)
    try {
      // Preparar datos según el rol
      const updateData: any = {
        descripcion: data.descripcion,
        servicios: serviciosOrden
      }

      // Solo admin puede cambiar mecánico y mano de obra
      if (canEdit) {
        updateData.mecanicoId = data.mecanicoId
        updateData.manoDeObra = parseFloat(data.manoDeObra) || 0
      }

      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('Orden actualizada exitosamente')
        router.push(`/ordenes/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar orden')
      }
    } catch (error) {
      toast.error('Error al actualizar orden')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Orden no encontrada</h2>
        <Link href="/ordenes">
          <Button>Volver a Órdenes</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/ordenes/${orden.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar {orden.numeroOrden}</h1>
            <p className="text-gray-600">
              {isMecanico ? 'Actualizar servicios de la orden' : 'Modificar información de la orden'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información de la Orden */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Trabajo *
              </label>
              <textarea
                {...register('descripcion', { required: 'La descripción es requerida' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.descripcion && (
                <p className="text-sm text-red-600">{errors.descripcion.message}</p>
              )}
            </div>

            {canEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mecánico Asignado *
                  </label>
                  <select
                    {...register('mecanicoId', { required: 'Selecciona un mecánico' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar mecánico</option>
                    {mecanicos.map(mecanico => (
                      <option key={mecanico.id} value={mecanico.id}>
                        {mecanico.name}
                      </option>
                    ))}
                  </select>
                  {errors.mecanicoId && (
                    <p className="text-sm text-red-600">{errors.mecanicoId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mano de Obra (Opcional)
                  </label>
                  <Input
                    {...register('manoDeObra')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Costo adicional por mano de obra especializada</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Servicios */}
        {canEditServicios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-green-600" />
                <span>Servicios</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Servicios disponibles para agregar */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Agregar Servicios:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {serviciosDisponibles.map(servicio => (
                    <div 
                      key={servicio.clave} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{servicio.descripcion}</div>
                        <div className="text-sm text-gray-500">${parseFloat(servicio.valor).toLocaleString()}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => agregarServicio(servicio)}
                        disabled={serviciosOrden.some(s => s.clave === servicio.clave && !s.isNew)}
                        className="bg-green-600 hover:bg-green-700 ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servicios en la orden */}
              {serviciosOrden.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Servicios en esta Orden ({serviciosOrden.length}):
                  </h4>
                  <div className="space-y-3">
                    {serviciosOrden.map((servicio, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-2 ${
                          servicio.isNew ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {servicio.descripcion}
                              {servicio.isNew && (
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <label className="text-sm text-gray-600">Precio:</label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={servicio.precio}
                                onChange={(e) => actualizarPrecioServicio(index, parseFloat(e.target.value) || 0)}
                                className="w-32 h-9"
                              />
                              <span className="text-sm font-semibold text-green-600">
                                ${servicio.precio.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removerServicio(index)}
                            className="text-red-600 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total de Servicios */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Servicios:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${calcularTotalServicios().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Link href={`/ordenes/${orden.id}`}>
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}