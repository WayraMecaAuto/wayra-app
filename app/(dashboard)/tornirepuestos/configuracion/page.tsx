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
import Image from 'next/image'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/TorniRepuestos.png"
                alt="TorniRepuestos Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuración TorniRepuestos</h1>
              <p className="text-red-100 text-lg">Gestiona márgenes por categoría</p>
            </div>
          </div>
          <Button
            onClick={saveAllConfigurations}
            disabled={saving}
            className="bg-white text-red-800 hover:bg-red-50 shadow-lg"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuraciones por Categoría */}
        <div className="space-y-6">
          {/* Repuestos */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50">
            <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Repuestos Automotrices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen de Ganancia (%)
                </label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_REPUESTOS')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_REPUESTOS', e.target.value)}
                  placeholder="35"
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-teal-50">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtros Automotrices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen de Ganancia (%)
                </label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_FILTROS')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_FILTROS', e.target.value)}
                  placeholder="25"
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Lubricantes */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="h-5 w-5" />
                <span>Lubricantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen de Ganancia (%)
                </label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_LUBRICANTES')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_LUBRICANTES', e.target.value)}
                  placeholder="15"
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tornillería */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Bolt className="h-5 w-5" />
                <span>Tornillería</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen de Ganancia (%)
                </label>
                <Input
                  type="number"
                  value={getConfigValue('TORNILLERIA_MARGEN')}
                  onChange={(e) => setConfigValue('TORNILLERIA_MARGEN', e.target.value)}
                  placeholder="100"
                  className="text-lg font-semibold"
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
      </div>

      {/* Descuentos Generales */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Descuentos TorniRepuestos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento Minorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_DESCUENTO_MINORISTA')}
                onChange={(e) => setConfigValue('TORNI_DESCUENTO_MINORISTA', e.target.value)}
                placeholder="2"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Aplicado sobre precio de venta</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento Mayorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('TORNI_DESCUENTO_MAYORISTA')}
                onChange={(e) => setConfigValue('TORNI_DESCUENTO_MAYORISTA', e.target.value)}
                placeholder="5"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Aplicado sobre precio de venta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}