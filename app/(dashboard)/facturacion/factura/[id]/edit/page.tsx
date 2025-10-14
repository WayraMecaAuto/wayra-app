'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface Factura {
  id: string
  numeroFactura: string
  fecha: string
  vencimiento: string | null
  subtotal: number
  iva: number
  total: number
  estado: string
  observaciones: string | null
  cliente: {
    nombre: string
    numeroDocumento: string
  }
  orden: {
    numeroOrden: string
  }
}

export default function EditFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    vencimiento: '',
    observaciones: '',
    estado: 'PENDIENTE'
  })

  useEffect(() => {
    if (params.id) {
      fetchFactura()
    }
  }, [params.id])

  const fetchFactura = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facturacion/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFactura(data)
        setFormData({
          vencimiento: data.vencimiento ? data.vencimiento.split('T')[0] : '',
          observaciones: data.observaciones || '',
          estado: data.estado
        })
      }
    } catch (error) {
      console.error('Error fetching factura:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      const updateData: any = {
        observaciones: formData.observaciones,
        estado: formData.estado
      }

      if (formData.vencimiento) {
        updateData.vencimiento = new Date(formData.vencimiento).toISOString()
      }

      const response = await fetch(`/api/facturacion/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        alert('Factura actualizada exitosamente')
        router.push(`/facturacion/factura/${params.id}`)
      } else {
        alert('Error al actualizar factura')
      }
    } catch (error) {
      console.error('Error updating factura:', error)
      alert('Error al actualizar factura')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!factura) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Factura no encontrada</p>
      </div>
    )
  }

  if (factura.estado === 'ANULADA') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No se puede editar una factura anulada</p>
        <Link
          href="/facturacion"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Volver a facturas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/facturacion/factura/${factura.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Factura</h1>
            <p className="text-gray-600 mt-1">{factura.numeroFactura}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Información de la factura (solo lectura) */}
            <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  value={factura.cliente.nombre}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento
                </label>
                <input
                  type="text"
                  value={factura.cliente.numeroDocumento}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <input
                  type="text"
                  value={factura.orden.numeroOrden}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Emisión
                </label>
                <input
                  type="text"
                  value={new Date(factura.fecha).toLocaleDateString('es-CO')}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {/* Campos editables */}
            <div className="space-y-4">
              <div>
                <label htmlFor="vencimiento" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  id="vencimiento"
                  value={formData.vencimiento}
                  onChange={(e) => setFormData({ ...formData, vencimiento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PAGADA">Pagada</option>
                  <option value="VENCIDA">Vencida</option>
                </select>
              </div>

              <div>
                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Añade observaciones sobre la factura..."
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href={`/facturacion/factura/${factura.id}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Resumen de la Factura */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Factura</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">${factura.subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">IVA (19%):</span>
                <span className="font-semibold text-gray-900">${factura.iva.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">${factura.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> Solo puedes modificar la fecha de vencimiento, el estado y las observaciones. 
                Los montos de la factura no se pueden editar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}