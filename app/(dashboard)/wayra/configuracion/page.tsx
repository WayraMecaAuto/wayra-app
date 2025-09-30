'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Settings, DollarSign, Percent, Calculator, Globe, Package,
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

export default function WayraConfiguracionPage() {
  const { data: session } = useSession()
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

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
      const wayraConfigs = configuraciones.filter(c => 
        c.clave.includes('WAYRA') || c.clave.includes('TASA_USD') || c.clave.includes('IVA_CALAN')
      )
      
      for (const config of wayraConfigs) {
        await updateConfiguracion(config.clave, config.valor)
      }
      toast.success('Configuraciones de Wayra guardadas')
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
              <Image
                src="/images/WayraLogo.png"
                alt="Wayra Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuración Wayra</h1>
              <p className="text-blue-100 text-lg">Gestiona márgenes, IVA y configuraciones</p>
            </div>
          </div>
          <Button
            onClick={saveAllConfigurations}
            disabled={saving}
            className="bg-white text-blue-800 hover:bg-blue-50 shadow-lg"
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
        {/* Configuraciones ENI */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Wayra ENI (Nacional)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('WAYRA_MARGEN_ENI')}
                onChange={(e) => setConfigValue('WAYRA_MARGEN_ENI', e.target.value)}
                placeholder="35"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Margen aplicado sobre precio de compra</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">IVA para ENI</span>
              </div>
              <p className="text-sm text-blue-600">
                Los productos ENI no tienen IVA obligatorio. El IVA se aplica opcionalmente al 19%.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calculator className="h-4 w-4 inline mr-1" />
                Descuento Minorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('WAYRA_DESCUENTO_MINORISTA')}
                onChange={(e) => setConfigValue('WAYRA_DESCUENTO_MINORISTA', e.target.value)}
                placeholder="3"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calculator className="h-4 w-4 inline mr-1" />
                Descuento Mayorista (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('WAYRA_DESCUENTO_MAYORISTA')}
                onChange={(e) => setConfigValue('WAYRA_DESCUENTO_MAYORISTA', e.target.value)}
                placeholder="10"
                className="text-lg font-semibold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuraciones CALAN */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Wayra CALAN (Importado)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Tasa USD a COP
              </label>
              <Input
                type="number"
                value={getConfigValue('TASA_USD_COP')}
                onChange={(e) => setConfigValue('TASA_USD_COP', e.target.value)}
                placeholder="4000"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Tasa de conversión para productos importados</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                Margen de Ganancia (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('WAYRA_MARGEN_CALAN')}
                onChange={(e) => setConfigValue('WAYRA_MARGEN_CALAN', e.target.value)}
                placeholder="35"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                IVA CALAN (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('IVA_CALAN')}
                onChange={(e) => setConfigValue('IVA_CALAN', e.target.value)}
                placeholder="15"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">IVA obligatorio para productos CALAN</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Configuración CALAN</span>
              </div>
              <p className="text-sm text-orange-600">
                Los productos CALAN tienen IVA del 15% obligatorio y conversión automática USD → COP.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del Sistema */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Información del Sistema Wayra</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-xl border border-blue-100 shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-2">ENI</div>
              <div className="text-sm text-gray-600">Productos Nacionales</div>
              <div className="text-xs text-gray-500 mt-1">Sin IVA obligatorio</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-md">
              <div className="text-3xl font-bold text-orange-600 mb-2">CALAN</div>
              <div className="text-sm text-gray-600">Productos Importados</div>
              <div className="text-xs text-gray-500 mt-1">IVA 15% obligatorio</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-2">35%</div>
              <div className="text-sm text-gray-600">Margen Estándar</div>
              <div className="text-xs text-gray-500 mt-1">Ambos productos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}