'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Settings, Percent, Calculator, Car, Filter, Droplets, Bolt,
  Save, RefreshCw, Zap, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [productosActualizados, setProductosActualizados] = useState<number | null>(null)

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
        const data = await response.json()
        setConfiguraciones(prev => 
          prev.map(config => 
            config.clave === clave ? { ...config, valor } : config
          )
        )
        
        if (data.productosActualizados > 0) {
          setProductosActualizados(data.productosActualizados)
          toast.success(`${data.productosActualizados} productos actualizados automáticamente`)
          
          setTimeout(() => setProductosActualizados(null), 5000)
        } else {
          toast.success('Guardado correctamente')
        }
      } else {
        toast.error('Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const saveAllConfigurations = async () => {
    setSaving(true)
    let totalProductosActualizados = 0
    
    try {
      const torniConfigs = configuraciones.filter(c => 
        c.clave.includes('TORNI') || c.clave.includes('TORNILLERIA')
      )
      
      for (const config of torniConfigs) {
        const response = await fetch('/api/configuracion', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clave: config.clave, valor: config.valor })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.productosActualizados) {
            totalProductosActualizados += data.productosActualizados
          }
        }
      }
      
      if (totalProductosActualizados > 0) {
        setProductosActualizados(totalProductosActualizados)
        toast.success(`¡Guardado! ${totalProductosActualizados} productos actualizados`)
        setTimeout(() => setProductosActualizados(null), 5000)
      } else {
        toast.success('¡Todas las configuraciones se guardaron!')
      }
    } catch (error) {
      toast.error('Error al guardar')
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-gray-300 border-t-indigo-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Alerta de productos actualizados */}
        <AnimatePresence>
          {productosActualizados !== null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border-2 border-green-500 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-green-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-green-900">Actualización Automática Exitosa</h3>
                  <p className="text-green-700 text-sm">
                    {productosActualizados} productos han sido recalculados con los nuevos márgenes
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Bolt className="w-10 h-10 text-white" />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl font-bold">Configuración TorniRepuestos</h1>
                  <p className="text-white/80 mt-1 text-sm sm:text-base">Los cambios se aplican automáticamente al inventario</p>
                </div>
              </div>

              <Button
                onClick={saveAllConfigurations}
                disabled={saving}
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-lg transition-all duration-300 hover:scale-105 min-w-44"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Guardar y Actualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Categorías de Márgenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Repuestos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-600 text-white pb-4 rounded-md">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Car className="w-6 h-6" />
                  Repuestos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <label className="text-sm font-medium text-gray-700">Margen de ganancia (%)</label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_REPUESTOS')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_REPUESTOS', e.target.value)}
                  onBlur={(e) => updateConfiguracion('TORNI_MARGEN_REPUESTOS', e.target.value)}
                  placeholder="25"
                  className="mt-2 text-2xl font-bold text-indigo-700 border-2 focus:border-indigo-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Se actualizarán automáticamente</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white pb-4 rounded-md">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Filter className="w-6 h-6" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <label className="text-sm font-medium text-gray-700">Margen de ganancia (%)</label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_FILTROS')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_FILTROS', e.target.value)}
                  onBlur={(e) => updateConfiguracion('TORNI_MARGEN_FILTROS', e.target.value)}
                  placeholder="25"
                  className="mt-2 text-2xl font-bold text-teal-700 border-2 focus:border-teal-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Se actualizarán automáticamente</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lubricantes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4 rounded-md">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Droplets className="w-6 h-6" />
                  Lubricantes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <label className="text-sm font-medium text-gray-700">Margen de ganancia (%)</label>
                <Input
                  type="number"
                  value={getConfigValue('TORNI_MARGEN_LUBRICANTES')}
                  onChange={(e) => setConfigValue('TORNI_MARGEN_LUBRICANTES', e.target.value)}
                  onBlur={(e) => updateConfiguracion('TORNI_MARGEN_LUBRICANTES', e.target.value)}
                  placeholder="15"
                  className="mt-2 text-2xl font-bold text-indigo-700 border-2 focus:border-indigo-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">Se actualizarán automáticamente</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tornillería */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white pb-4 rounded-md">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Bolt className="w-6 h-6" />
                  Tornillería
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Margen de ganancia (%)</label>
                  <Input
                    type="number"
                    value={getConfigValue('TORNILLERIA_MARGEN')}
                    onChange={(e) => setConfigValue('TORNILLERIA_MARGEN', e.target.value)}
                    onBlur={(e) => updateConfiguracion('TORNILLERIA_MARGEN', e.target.value)}
                    placeholder="100"
                    className="mt-2 text-2xl font-bold text-gray-800 border-2 focus:border-gray-600 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">Se actualizarán automáticamente</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg">
                  <strong>Nota:</strong> IVA 19% obligatorio.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Descuentos Generales */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-md">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Percent className="w-7 h-7" />
                Descuentos Generales TorniRepuestos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-700">Descuento Minorista (%)</label>
                  <Input
                    type="number"
                    value={getConfigValue('TORNI_DESCUENTO_MINORISTA')}
                    onChange={(e) => setConfigValue('TORNI_DESCUENTO_MINORISTA', e.target.value)}
                    onBlur={(e) => updateConfiguracion('TORNI_DESCUENTO_MINORISTA', e.target.value)}
                    placeholder="2"
                    className="text-3xl font-bold text-emerald-700 border-2 focus:border-emerald-500 transition-all"
                  />
                  <p className="text-sm text-gray-500">Los precios se actualizarán automáticamente</p>
                </div>

                <div className="space-y-3">
                  <label className="text-base font-semibold text-gray-700">Descuento Mayorista (%)</label>
                  <Input
                    type="number"
                    value={getConfigValue('TORNI_DESCUENTO_MAYORISTA')}
                    onChange={(e) => setConfigValue('TORNI_DESCUENTO_MAYORISTA', e.target.value)}
                    onBlur={(e) => updateConfiguracion('TORNI_DESCUENTO_MAYORISTA', e.target.value)}
                    placeholder="5"
                    className="text-3xl font-bold text-teal-700 border-2 focus:border-teal-500 transition-all"
                  />
                  <p className="text-sm text-gray-500">Los precios se actualizarán automáticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sistema de Actualización */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Settings className="h-6 w-6" />
                Sistema de Actualización Automática
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700 mb-1">Instantáneo</div>
                  <p className="text-sm font-medium text-gray-700">Los cambios se aplican inmediatamente</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700 mb-1">Sin Errores</div>
                  <p className="text-sm font-medium text-gray-700">Recálculo automático garantizado</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <RefreshCw className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700 mb-1">Sincronizado</div>
                  <p className="text-sm font-medium text-gray-700">Inventario siempre actualizado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}