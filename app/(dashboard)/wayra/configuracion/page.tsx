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
import { motion } from 'framer-motion'

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-2xl text-white"
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                <Image
                  src="/images/WayraLogo.png"
                  alt="Wayra Logo"
                  width={48}
                  height={48}
                  className="object-contain drop-shadow-lg"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración Wayra</h1>
                <p className="text-blue-100 text-sm sm:text-base mt-1">Gestión avanzada de márgenes, tasas e IVA</p>
              </div>
            </div>

            <Button
              onClick={saveAllConfigurations}
              disabled={saving}
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-xl transition-all duration-300 hover:scale-105"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Guardar Todo
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
          {/* ENI Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Package className="h-6 w-6" />
                  </div>
                  <span>Wayra ENI (Nacional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Percent className="h-4 w-4 text-blue-600" />
                    Margen de Ganancia (%)
                  </label>
                  <Input
                    type="number"
                    value={getConfigValue('WAYRA_MARGEN_ENI')}
                    onChange={(e) => setConfigValue('WAYRA_MARGEN_ENI', e.target.value)}
                    placeholder="35"
                    className="text-lg font-bold border-2 focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-gray-500">Sobre precio de compra</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-blue-700" />
                    <span className="font-medium text-blue-800 text-sm">IVA para ENI</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    IVA opcional del 19%. No obligatorio para productos nacionales.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      Minorista (%)
                    </label>
                    <Input
                      type="number"
                      value={getConfigValue('WAYRA_DESCUENTO_MINORISTA')}
                      onChange={(e) => setConfigValue('WAYRA_DESCUENTO_MINORISTA', e.target.value)}
                      placeholder="3"
                      className="font-bold border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      Mayorista (%)
                    </label>
                    <Input
                      type="number"
                      value={getConfigValue('WAYRA_DESCUENTO_MAYORISTA')}
                      onChange={(e) => setConfigValue('WAYRA_DESCUENTO_MAYORISTA', e.target.value)}
                      placeholder="10"
                      className="font-bold border-2 focus:border-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CALAN Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Globe className="h-6 w-6" />
                  </div>
                  <span>Wayra CALAN (Importado)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    Tasa USD → COP
                  </label>
                  <Input
                    type="number"
                    value={getConfigValue('TASA_USD_COP')}
                    onChange={(e) => setConfigValue('TASA_USD_COP', e.target.value)}
                    placeholder="4000"
                    className="text-lg font-bold border-2 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Percent className="h-4 w-4 text-orange-600" />
                      Margen (%)
                    </label>
                    <Input
                      type="number"
                      value={getConfigValue('WAYRA_MARGEN_CALAN')}
                      onChange={(e) => setConfigValue('WAYRA_MARGEN_CALAN', e.target.value)}
                      placeholder="35"
                      className="font-bold border-2 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Percent className="h-4 w-4 text-orange-600" />
                      IVA CALAN (%)
                    </label>
                    <Input
                      type="number"
                      value={getConfigValue('IVA_CALAN')}
                      onChange={(e) => setConfigValue('IVA_CALAN', e.target.value)}
                      placeholder="15"
                      className="font-bold border-2 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-orange-700" />
                    <span className="font-medium text-orange-800 text-sm">Características CALAN</span>
                  </div>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    IVA obligatorio del 15% + conversión automática USD a COP.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Resumen del sistema */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Settings className="h-6 w-6" />
                Resumen del Sistema Wayra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200"
                >
                  <div className="text-4xl font-bold text-blue-700 mb-2">ENI</div>
                  <p className="text-sm font-medium text-gray-700">Productos Nacionales</p>
                  <p className="text-xs text-gray-600 mt-1">IVA opcional</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200"
                >
                  <div className="text-4xl font-bold text-orange-700 mb-2">CALAN</div>
                  <p className="text-sm font-medium text-gray-700">Productos Importados</p>
                  <p className="text-xs text-gray-600 mt-1">IVA 15% obligatorio</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200"
                >
                  <div className="text-4xl font-bold text-green-700 mb-2">35%</div>
                  <p className="text-sm font-medium text-gray-700">Margen Estándar</p>
                  <p className="text-xs text-gray-600 mt-1">Aplica a ambos tipos</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}