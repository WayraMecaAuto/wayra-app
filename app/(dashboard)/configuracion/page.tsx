'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Settings, DollarSign, Building, Phone, Mail, MapPin, 
  Save, RefreshCw, Globe, Percent, Calculator
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

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Verificar que sea admin
  if (session?.user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  useEffect(() => {
    fetchConfiguraciones()
  }, [])

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
      for (const config of configuraciones) {
        await updateConfiguracion(config.clave, config.valor)
      }
      toast.success('Todas las configuraciones guardadas')
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
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuración del Sistema</h1>
              <p className="text-gray-200 text-lg">Gestiona las configuraciones globales</p>
            </div>
          </div>
          <Button
            onClick={saveAllConfigurations}
            disabled={saving}
            className="bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
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
        {/* Configuraciones de Precios */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Configuraciones de Precios</span>
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
              <p className="text-xs text-gray-500 mt-1">Para productos Wayra CALAN</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                IVA General (%)
              </label>
              <Input
                type="number"
                value={getConfigValue('IVA_GENERAL')}
                onChange={(e) => setConfigValue('IVA_GENERAL', e.target.value)}
                placeholder="19"
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">IVA para productos nacionales</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
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
          </CardContent>
        </Card>

        {/* Información de la Empresa */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Información de la Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Nombre de la Empresa
              </label>
              <Input
                value={getConfigValue('EMPRESA_NOMBRE')}
                onChange={(e) => setConfigValue('EMPRESA_NOMBRE', e.target.value)}
                placeholder="Wayra & TorniRepuestos"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT
              </label>
              <Input
                value={getConfigValue('EMPRESA_NIT')}
                onChange={(e) => setConfigValue('EMPRESA_NIT', e.target.value)}
                placeholder="900123456-7"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Dirección
              </label>
              <Input
                value={getConfigValue('EMPRESA_DIRECCION')}
                onChange={(e) => setConfigValue('EMPRESA_DIRECCION', e.target.value)}
                placeholder="Calle 123 #45-67, Bogotá"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </label>
              <Input
                value={getConfigValue('EMPRESA_TELEFONO')}
                onChange={(e) => setConfigValue('EMPRESA_TELEFONO', e.target.value)}
                placeholder="+57 1 234 5678"
                className="text-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <Input
                type="email"
                value={getConfigValue('EMPRESA_EMAIL')}
                onChange={(e) => setConfigValue('EMPRESA_EMAIL', e.target.value)}
                placeholder="info@wayra.com"
                className="text-lg font-semibold"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}