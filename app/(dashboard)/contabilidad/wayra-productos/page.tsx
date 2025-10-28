'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, BarChart3, Download, Plus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface IngresoContable {
  id: string
  fecha: Date
  cantidad: number
  descripcion: string
  tipo: string
  precioCompra: number
  precioVenta: number
  utilidad: number
  ordenId?: string
  productoId: string
  motivo: string
}

interface EgresoContable {
  id: string
  fecha: Date
  descripcion: string
  concepto: string
  usuario: string
  valor: number
}

export default function ContabilidadWayraProductosPage() {
  const { data: session } = useSession()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [año, setAño] = useState(new Date().getFullYear())
  const [ingresos, setIngresos] = useState<IngresoContable[]>([])
  const [egresos, setEgresos] = useState<EgresoContable[]>([])
  const [loading, setLoading] = useState(true)
  const [showEgresoModal, setShowEgresoModal] = useState(false)
  const [searchIngresos, setSearchIngresos] = useState('')
  const [searchEgresos, setSearchEgresos] = useState('')

  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchContabilidad()
    }
  }, [hasAccess, mes, año])

  const fetchContabilidad = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contabilidad/wayra-productos?mes=${mes}&año=${año}`)
      if (response.ok) {
        const data = await response.json()
        setIngresos(data.ingresos || [])
        setEgresos(data.egresos || [])
      } else {
        toast.error('Error al cargar contabilidad')
      }
    } catch (error) {
      toast.error('Error al cargar contabilidad')
    } finally {
      setLoading(false)
    }
  }

  const eliminarEgreso = async (id: string) => {
    if (!confirm('¿Eliminar este egreso?')) return

    try {
      const response = await fetch(`/api/contabilidad/wayra-productos?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('Egreso eliminado')
        fetchContabilidad()
      } else {
        toast.error('Error al eliminar egreso')
      }
    } catch (error) {
      toast.error('Error al eliminar egreso')
    }
  }

  const calcularTotales = () => {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0)
    const totalCostos = ingresos.reduce((sum, i) => sum + i.precioCompra * i.cantidad, 0)
    const totalEgresos = egresos.reduce((sum, e) => sum + e.valor, 0)
    const totalUtilidad = totalIngresos - totalCostos - totalEgresos

    return { totalIngresos, totalCostos, totalEgresos, totalUtilidad }
  }

  const filteredIngresos = ingresos.filter(i =>
    i.descripcion.toLowerCase().includes(searchIngresos.toLowerCase()) ||
    i.motivo.toLowerCase().includes(searchIngresos.toLowerCase())
  )

  const filteredEgresos = egresos.filter(e =>
    e.descripcion.toLowerCase().includes(searchEgresos.toLowerCase()) ||
    e.concepto.toLowerCase().includes(searchEgresos.toLowerCase())
  )

  const totales = calcularTotales()

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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Image
              src="/images/WayraLogo.png"
              alt="Wayra Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Contabilidad Productos Wayra</h1>
            <p className="text-blue-100 text-lg">Ventas directas y desde órdenes</p>
          </div>
        </div>
      </div>

      {/* Selectores */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleString('es-CO', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Ingresos</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${totales.totalIngresos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Costos</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              ${totales.totalCostos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Egresos</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              ${totales.totalEgresos.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Utilidad</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totales.totalUtilidad >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
              ${totales.totalUtilidad.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingresos */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Ventas de Productos ({filteredIngresos.length})</span>
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchIngresos}
                onChange={(e) => setSearchIngresos(e.target.value)}
                className="pl-9 h-9 bg-white text-gray-900"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cant.</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">P.Compra</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">P.Venta</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngresos.length > 0 ? filteredIngresos.map((ingreso, index) => (
                  <tr key={ingreso.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-sm">
                      {new Date(ingreso.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{ingreso.descripcion}</div>
                      <div className="text-xs text-gray-500">{ingreso.motivo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={ingreso.tipo === 'WAYRA_ENI' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'}>
                        {ingreso.tipo === 'WAYRA_ENI' ? 'ENI' : 'CALAN'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{ingreso.cantidad}</td>
                    <td className="py-3 px-4 text-right">${ingreso.precioCompra.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                      ${ingreso.precioVenta.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      ${(ingreso.precioVenta * ingreso.cantidad).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      ${ingreso.utilidad.toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      No hay ventas para este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Egresos */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5" />
            <span>Egresos ({filteredEgresos.length})</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchEgresos}
                onChange={(e) => setSearchEgresos(e.target.value)}
                className="pl-9 h-9 bg-white text-gray-900"
              />
            </div>
            <Button
              onClick={() => setShowEgresoModal(true)}
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Concepto</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEgresos.length > 0 ? filteredEgresos.map((egreso, index) => (
                  <tr key={egreso.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-3 px-4 text-sm">
                      {new Date(egreso.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{egreso.descripcion}</td>
                    <td className="py-3 px-4">
                      <Badge className="text-xs">{egreso.concepto}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600">
                      -${egreso.valor.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => eliminarEgreso(egreso.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No hay egresos para este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EgresoModal
        isOpen={showEgresoModal}
        onClose={() => setShowEgresoModal(false)}
        onSuccess={fetchContabilidad}
      />
    </div>
  )
}

function EgresoModal({ isOpen, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    descripcion: '',
    valor: '',
    concepto: 'GASTO_OPERATIVO'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descripcion || !formData.valor) {
      toast.error('Completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/contabilidad/wayra-productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Egreso registrado')
        setFormData({ descripcion: '', valor: '', concepto: 'GASTO_OPERATIVO' })
        onSuccess()
        onClose()
      } else {
        toast.error('Error al registrar egreso')
      }
    } catch (error) {
      toast.error('Error al registrar egreso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Egreso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
          <Input
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Ej: Compra de inventario"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Concepto *</label>
          <select
            value={formData.concepto}
            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="GASTO_OPERATIVO">Gasto Operativo</option>
            <option value="COMPRA_PRODUCTO">Compra de Producto</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}