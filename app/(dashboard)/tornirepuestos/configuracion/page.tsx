'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Settings, Percent, Calculator, Car, Filter, Droplets, Bolt,
  Save, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface Configuracion {
  clave: string
  valor: string
  descripcion: string
}

export default function TorniRepuestosConfiguracionPage() {
  const { data: session } = useSession()
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      fetchConfiguraciones()
    }
  }, [hasAccess])

  const fetchConfiguraciones = async () => {
    try {
      const response = await fetch('/api/configuracion')
      if (response.ok) {
        const data = await response.json()
        setConfiguraciones(data)
      } else {
        toast.error('Error al cargar configuraciones')
      }
    } catch (error) {
      toast.error('Error al cargar configuraciones')
    } finally {
      setLoading(false)
    }
  }

  const updateConfiguracion = async (clave: string, valor: string) => {
    try {
      const response = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor })
      })

      if (response.ok) {
        setConfiguraciones(prev => 
          prev.map(config => 
            config.clave === clave ? { ...config, valor } : config
          )
        )
        toast.success('Configuración actualizada')
      } else {
        toast.error('Error al actualizar configuración')
      }
    } catch (error) {
      toast.error('Error al actualizar configuración')
    }
  }

  const saveAllConfigurations = async () => {
    setSaving(true)
    try {
      const torniConfigs = configuraciones.filter(c => 
        c.clave.includes('TORNI') || c.clave.includes('TORNILLERIA')
      )
      
      for (const config of torniConfigs) {
        await updateConfiguracion(config.clave, config.valor)
      }
      toast.success('Configuraciones de TorniRepuestos guardadas')
    } catch (error) {
      toast.error('Error al guardar configuraciones')
    } finally {
      setSaving(false)
    }
  }

  const getConfigValue = (clave: string) => {
    return configuraciones.find(c => c.clave === clave)?.valor || ''
  }

  const setConfigValue = (clave: string, valor: string) => {
    setConfiguraciones(prev => 
      prev.map(config => 
        config.clave === clave ? { ...config, valor } : config
      )
    )
  }

  if (!hasAccess) {
    redirect('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-105">
              <Bolt className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Configuración TorniRepuestos</h1>
              <p className="text-gray-200 text-base sm:text-lg">Gestiona márgenes por categoría</p>
            </div>
          </div>
          <Button
            onClick={saveAllConfigurations}
            disabled={saving}
            className="bg-gray-700 text-white hover:bg-gray-800 shadow-lg w-full sm:w-auto transition-all duration-300 hover:scale-105"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Repuestos */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg p-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Car className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>Repuestos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_MARGEN_REPUESTOS')}
                onChange={(e) => setConfigValue('TORNI_MARGEN_REPUESTOS', e.target.value)}
                placeholder="25"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-lg p-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Filter className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_MARGEN_FILTROS')}
                onChange={(e) => setConfigValue('TORNI_MARGEN_FILTROS', e.target.value)}
                placeholder="25"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lubricantes */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg p-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Droplets className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>Lubricantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_MARGEN_LUBRICANTES')}
                onChange={(e) => setConfigValue('TORNI_MARGEN_LUBRICANTES', e.target.value)}
                placeholder="15"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tornillería */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg p-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Bolt className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>Tornillería</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNILLERIA_MARGEN')}
                onChange={(e) => setConfigValue('TORNILLERIA_MARGEN', e.target.value)}
                placeholder="100"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Nota:</strong> Tornillería tiene IVA 19% obligatorio y margen alto debido a la naturaleza del producto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descuentos Generales */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg p-4">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Calculator className="h-4 sm:h-5 w-4 sm:w-5" />
            <span>Descuentos TorniRepuestos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Descuento Minorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_DESCUENTO_MINORISTA')}
                onChange={(e) => setConfigValue('TORNI_DESCUENTO_MINORISTA', e.target.value)}
                placeholder="2"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
              <p className="text-xs text-gray-500 mt-1">Aplicado sobre precio de venta</p>
            </div>
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                Descuento Mayorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_DESCUENTO_MAYORISTA')}
                onChange={(e) => setConfigValue('TORNI_DESCUENTO_MAYORISTA', e.target.value)}
                placeholder="5"
                className="text-base sm:text-lg font-semibold shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
              <p className="text-xs text-gray-500 mt-1">Aplicado sobre precio de venta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}