'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
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

export default function EditOrdenPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [orden, setOrden] = useState<any>(null)
  const [mecanicos, setMecanicos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditOrdenForm>()

  useEffect(() => {
    if (params.id) {
      fetchOrden()
      fetchMecanicos()
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

  const onSubmit = async (data: EditOrdenForm) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: data.descripcion,
          mecanicoId: data.mecanicoId,
          manoDeObra: parseFloat(data.manoDeObra) || 0
        })
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
            <p className="text-gray-600">Modificar información de la orden</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          </CardContent>
        </Card>

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