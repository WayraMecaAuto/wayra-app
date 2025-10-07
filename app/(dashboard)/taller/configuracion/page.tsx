'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Settings, Wrench, DollarSign, Save, RefreshCw, Plus, CreditCard as Edit, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import toast from 'react-hot-toast'

interface Servicio {
  clave: string
  descripcion: string
  valor: string
}

export default function TallerConfiguracionPage() {
  const { data: session } = useSession()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchServicios()
    }
  }, [hasAccess])

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios-taller')
      if (response.ok) {
        const data = await response.json()
        setServicios(data)
      } else {
        toast.error('Error al cargar servicios')
      }
    } catch (error) {
      toast.error('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }

  const saveAllServices = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/servicios-taller', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicios })
      })

      if (response.ok) {
        toast.success('Servicios guardados correctamente')
      } else {
        toast.error('Error al guardar servicios')
      }
    } catch (error) {
      toast.error('Error al guardar servicios')
    } finally {
      setSaving(false)
    }
  }

  const updateServicio = (index: number, campo: string, valor: string) => {
    const nuevosServicios = [...servicios]
    nuevosServicios[index] = { ...nuevosServicios[index], [campo]: valor }
    setServicios(nuevosServicios)
  }

  const agregarServicio = (nuevoServicio: { descripcion: string; precio: number }) => {
    const clave = `SERVICIO_${nuevoServicio.descripcion.toUpperCase().replace(/\s+/g, '_')}`
    const servicio: Servicio = {
      clave,
      descripcion: nuevoServicio.descripcion,
      valor: nuevoServicio.precio.toString()
    }
    setServicios([...servicios, servicio])
    setShowModal(false)
    toast.success('Servicio agregado')
  }

  const eliminarServicio = (index: number) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      setServicios(servicios.filter((_, i) => i !== index))
      toast.success('Servicio eliminado')
    }
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Wrench className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuración del Taller</h1>
              <p className="text-blue-100 text-lg">Gestiona servicios y precios del taller</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-800 hover:bg-blue-50 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
            <Button
              onClick={saveAllServices}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 shadow-lg"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Servicios */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
          <CardTitle className="text-xl text-gray-800 flex items-center space-x-2">
            <Settings className="h-6 w-6 text-green-600" />
            <span>Servicios del Taller ({servicios.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {servicios.map((servicio, index) => (
              <div key={servicio.clave} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Input
                        value={servicio.descripcion}
                        onChange={(e) => updateServicio(index, 'descripcion', e.target.value)}
                        className="font-medium text-gray-900 border-0 p-0 h-auto focus:ring-0"
                        placeholder="Nombre del servicio"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => eliminarServicio(index)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <Input
                    type="number"
                    value={servicio.valor}
                    onChange={(e) => updateServicio(index, 'valor', e.target.value)}
                    className="text-lg font-bold text-green-600"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          {servicios.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No hay servicios configurados</h3>
              <p className="text-gray-400 mb-4">Agrega el primer servicio del taller</p>
              <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Servicio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para nuevo servicio */}
      <NuevoServicioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={agregarServicio}
      />
    </div>
  )
}

// Componente para modal de nuevo servicio
function NuevoServicioModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean
  onClose: () => void
  onAdd: (servicio: { descripcion: string; precio: number }) => void
}) {
  const [formData, setFormData] = useState({
    descripcion: '',
    precio: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descripcion || formData.precio <= 0) {
      toast.error('Completa todos los campos')
      return
    }

    onAdd(formData)
    setFormData({ descripcion: '', precio: 0 })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Servicio">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Servicio *
          </label>
          <Input
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Ej: Alineación y balanceo"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Precio del servicio:</span>
            <span className="text-xl font-bold text-green-600">
              ${formData.precio.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </form>
    </Modal>
  )
}