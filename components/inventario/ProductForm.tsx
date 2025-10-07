'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { BarcodeDisplay } from '@/components/ui/barcode-display'
import { Camera, DollarSign, Package, Sparkles, Eye, EyeOff, Settings, ShoppingCart, TrendingUp, ChevronDown } from 'lucide-react'
import { calculatePrices, getPricingConfig } from '@/lib/pricing'
import { generateEAN13 } from '@/lib/barcode'
import toast from 'react-hot-toast'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: any
  tipo: string
  categoria: string
}

interface ProductFormData {
  codigo: string
  codigoBarras: string
  nombre: string
  descripcion: string
  precioCompra: string
  monedaCompra: string
  aplicaIva: boolean
  stockMinimo: string
  stockInicial: string
}

export function ProductForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product, 
  tipo, 
  categoria 
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [previewPrices, setPreviewPrices] = useState<any>(null)
  const [tasaUSD, setTasaUSD] = useState(4000)
  const [showBarcodePreview, setShowBarcodePreview] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ProductFormData>()
  
  const precioCompra = watch('precioCompra')
  const aplicaIva = watch('aplicaIva')

  useEffect(() => {
    if (product && isOpen) {
      setValue('codigo', product.codigo)
      setValue('codigoBarras', product.codigoBarras || '')
      setValue('nombre', product.nombre)
      setValue('descripcion', product.descripcion || '')
      setValue('precioCompra', product.precioCompra.toString())
      setValue('monedaCompra', product.monedaCompra)
      setValue('aplicaIva', product.aplicaIva)
      setValue('stockMinimo', product.stockMinimo.toString())
    } else if (isOpen) {
      const timestamp = Date.now().toString().slice(-6)
      const prefix = tipo === 'WAYRA_ENI' ? 'WE' : 
                   tipo === 'WAYRA_CALAN' ? 'WC' : 
                   tipo === 'TORNILLERIA' ? 'TO' : 'TR'
      setValue('codigo', `${prefix}${timestamp}`)
      
      if (tipo !== 'TORNILLERIA') {
        setValue('codigoBarras', generateEAN13())
      }
      
      setValue('monedaCompra', tipo === 'WAYRA_CALAN' ? 'USD' : 'COP')
      setValue('stockInicial', '0')
      setValue('stockMinimo', '5')
      
      const config = getPricingConfig(tipo as any, categoria)
      setValue('aplicaIva', config.ivaObligatorio)
    }
  }, [product, isOpen, tipo, categoria, setValue])

  useEffect(() => {
    if (precioCompra && parseFloat(precioCompra) > 0) {
      const prices = calculatePrices(
        parseFloat(precioCompra),
        tipo as any,
        categoria,
        aplicaIva,
        tasaUSD
      )
      setPreviewPrices(prices)
    } else {
      setPreviewPrices(null)
    }
  }, [precioCompra, aplicaIva, tipo, categoria, tasaUSD])

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    try {
      const url = product ? `/api/productos/${product.id}` : '/api/productos'
      const method = product ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tipo,
          categoria,
          precioCompra: parseFloat(data.precioCompra),
          stockMinimo: parseInt(data.stockMinimo),
          stockInicial: parseInt(data.stockInicial)
        })
      })

      if (response.ok) {
        toast.success(product ? 'Producto actualizado' : 'Producto creado exitosamente')
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar producto')
      }
    } catch (error) {
      toast.error('Error al guardar producto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBarcodeScanned = (code: string) => {
    setValue('codigoBarras', code)
    setShowScanner(false)
  }

  const handleClose = () => {
    reset()
    setPreviewPrices(null)
    setShowBarcodePreview(false)
    setShowAdvanced(false)
    onClose()
  }

  const config = getPricingConfig(tipo as any, categoria)

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        title={product ? 'Editar Producto' : 'Nuevo Producto'} 
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          
          {/* Header con animación */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 animate-pulse-slow"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative flex-shrink-0 animate-bounce-soft">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-sm" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                      {tipo === 'WAYRA_ENI' ? 'Wayra ENI' : 
                       tipo === 'WAYRA_CALAN' ? 'Wayra CALAN' :
                       tipo === 'TORNILLERIA' ? 'Tornillería' : 
                       `TorniRepuestos - ${categoria}`}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="px-2 py-1 sm:px-3 bg-white rounded-full font-medium whitespace-nowrap shadow-sm hover:shadow-md transition-shadow duration-300">
                          Margen: {config.margenGanancia}%
                        </span>
                        <span className="px-2 py-1 sm:px-3 bg-white rounded-full font-medium shadow-sm hover:shadow-md transition-shadow duration-300">
                          IVA: {config.ivaObligatorio ? `${config.porcentajeIva}% Oblig.` : `${config.porcentajeIva}% Opc.`}
                        </span>
                        {config.conversionUSD && (
                          <span className="px-2 py-1 sm:px-3 bg-white rounded-full font-medium shadow-sm hover:shadow-md transition-shadow duration-300">
                            Conv. USD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Layout principal con animación stagger */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-6 lg:gap-8">
            
            {/* Información básica */}
            <div className="space-y-4 sm:space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md animate-bounce-soft">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Información Básica</h4>
              </div>

              {/* Código del producto */}
              <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Código del Producto *
                </label>
                <div className="relative group">
                  <Input
                    {...register('codigo', { required: 'El código es requerido' })}
                    placeholder="Ej: WE123456"
                    className={`h-10 sm:h-12 text-sm sm:text-base font-mono font-semibold transition-all duration-300 ${
                      errors.codigo 
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-shake' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500 hover:border-gray-400 hover:shadow-md'
                    }`}
                  />
                </div>
                {errors.codigo && (
                  <div className="flex items-center space-x-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
                    <Package className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-red-600 font-medium">{errors.codigo.message}</p>
                  </div>
                )}
              </div>

              {/* Código de Barras */}
              {tipo !== 'TORNILLERIA' && (
                <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Código de Barras
                  </label>
                  <div className="flex space-x-2 sm:space-x-3">
                    <div className="flex-1 relative group">
                      <Input
                        {...register('codigoBarras')}
                        placeholder="Escanear o generar automático"
                        className="h-10 sm:h-12 text-sm sm:text-base font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 transition-all duration-300 hover:shadow-md"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                      className="px-2 sm:px-4 h-10 sm:h-12 transition-all duration-300 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    {watch('codigoBarras') && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBarcodePreview(!showBarcodePreview)}
                        className="px-2 sm:px-4 h-10 sm:h-12 transition-all duration-300 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105 active:scale-95"
                      >
                        {showBarcodePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Nombre del producto */}
              <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Nombre del Producto *
                </label>
                <div className="relative group">
                  <Input
                    {...register('nombre', { required: 'El nombre es requerido' })}
                    placeholder="Ej: Filtro de aceite Toyota"
                    className={`h-10 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-300 ${
                      errors.nombre 
                        ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-shake' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500 hover:border-gray-400 hover:shadow-md'
                    }`}
                  />
                </div>
                {errors.nombre && (
                  <div className="flex items-center space-x-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
                    <Package className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-red-600 font-medium">{errors.nombre.message}</p>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Descripción
                </label>
                <div className="relative group">
                  <textarea
                    {...register('descripcion')}
                    rows={3}
                    placeholder="Descripción detallada del producto..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Precios y configuración */}
            <div className="space-y-4 sm:space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md animate-bounce-soft">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Precios y Configuración</h4>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Precio de Compra */}
                <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Precio de Compra * ({watch('monedaCompra') || 'COP'})
                  </label>
                  <div className="relative group">
                    <Input
                      {...register('precioCompra', { 
                        required: 'El precio de compra es requerido',
                        pattern: {
                          value: /^\d+(\.\d{1,2})?$/,
                          message: 'Precio inválido'
                        }
                      })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={`h-10 sm:h-12 text-base sm:text-lg font-bold transition-all duration-300 ${
                        errors.precioCompra 
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500 animate-shake' 
                          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 hover:border-gray-400 hover:shadow-md'
                      }`}
                      style={{ 
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none'
                      }}
                    />
                  </div>
                  {errors.precioCompra && (
                    <div className="flex items-center space-x-2 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
                      <DollarSign className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-red-600 font-medium">{errors.precioCompra.message}</p>
                    </div>
                  )}
                </div>

                {/* Moneda */}
                <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:translate-x-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Moneda
                  </label>
                  <div className="relative group">
                    <select
                      {...register('monedaCompra')}
                      className="w-full h-10 sm:h-12 px-3 sm:px-4 text-sm sm:text-base font-semibold border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                      disabled={tipo === 'WAYRA_CALAN'}
                    >
                      <option value="COP">🇨🇴 COP (Pesos Colombianos)</option>
                      <option value="USD">🇺🇸 USD (Dólares)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección avanzada colapsable */}
              <div className="sm:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full h-10 justify-between text-sm font-medium transition-all duration-300 hover:bg-gray-50 hover:shadow-md"
                >
                  Configuración Avanzada
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${!showAdvanced ? 'hidden sm:block' : 'animate-slide-down'}`}>
                {/* Stock */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:scale-105">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                      Alerta de Stock
                    </label>
                    <Input
                      {...register('stockMinimo', { 
                        pattern: {
                          value: /^\d+$/,
                          message: 'Solo números enteros'
                        }
                      })}
                      type="number"
                      placeholder="5"
                      defaultValue="5"
                      className="h-10 sm:h-12 text-sm sm:text-base font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 transition-all duration-300 hover:shadow-md"
                    />
                  </div>

                  {!product && (
                    <div className="space-y-2 sm:space-y-3 transform transition-all duration-300 hover:scale-105">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                        Stock Inicial
                      </label>
                      <Input
                        {...register('stockInicial', { 
                          pattern: {
                            value: /^\d+$/,
                            message: 'Solo números enteros'
                          }
                        })}
                        type="number"
                        placeholder="0"
                        defaultValue="0"
                        className="h-10 sm:h-12 text-sm sm:text-base font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 transition-all duration-300 hover:shadow-md"
                      />
                    </div>
                  )}
                </div>

                {/* IVA */}
                {!config.ivaObligatorio && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105">
                    <label className="flex items-start space-x-3 sm:space-x-4 cursor-pointer group">
                      <div className="relative pt-0.5">
                        <input
                          {...register('aplicaIva')}
                          type="checkbox"
                          className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 border-2 border-gray-300 rounded focus:ring-emerald-500 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-gray-800">
                          Aplicar IVA ({config.porcentajeIva}%)
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          El IVA será incluido en los precios de venta
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {config.ivaObligatorio && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-blue-800">
                          IVA {config.porcentajeIva}% aplicado automáticamente
                        </span>
                        <p className="text-xs text-blue-600 mt-1">
                          Este producto requiere IVA obligatorio
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vista previa de precios con animación */}
          {previewPrices && (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10 animate-pulse-slow"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md animate-bounce-soft">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-800">Vista Previa de Precios</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                  <div className="text-center p-4 sm:p-5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-emerald-500 rounded-lg sm:rounded-xl animate-bounce-soft">
                      <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Precio Venta</div>
                    <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                      ${previewPrices.precioVenta.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-blue-500 rounded-lg sm:rounded-xl animate-bounce-soft">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Minorista</div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      ${previewPrices.precioMinorista.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-sm border border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-purple-500 rounded-lg sm:rounded-xl animate-bounce-soft">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2">Mayorista</div>
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">
                      ${previewPrices.precioMayorista.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 text-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 bg-white/70 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-gray-700 shadow-sm">
                    <span className="whitespace-nowrap">📈 Margen: {config.margenGanancia}%</span>
                    {(config.ivaObligatorio || aplicaIva) && (
                      <span className="whitespace-nowrap">💰 IVA: {config.porcentajeIva}%</span>
                    )}
                    {config.conversionUSD && (
                      <span className="whitespace-nowrap">💵 Tasa: ${tasaUSD}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Código de barras preview */}
          {tipo !== 'TORNILLERIA' && watch('codigoBarras') && showBarcodePreview && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm animate-slide-up">
              <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-center flex items-center justify-center space-x-2">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-sm sm:text-base">Vista Previa del Código de Barras</span>
              </h4>
              <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm">
                <BarcodeDisplay 
                  value={watch('codigoBarras')} 
                  productName={watch('nombre') || 'Producto'}
                  productCode={watch('codigo')}
                />
              </div>
            </div>
          )}

          {/* Botones de acción con animaciones */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 sm:pt-8 border-t border-gray-100 sticky bottom-0 sm:static bg-white sm:bg-transparent p-3 sm:p-0 -mx-1 sm:mx-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all duration-300 hover:bg-gray-50 hover:scale-105 active:scale-95 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 px-6 sm:px-8 py-3 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95 order-1 sm:order-2"
            >
              {isLoading && (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" />
              )}
              {isLoading ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
            </Button>
          </div>
        </form>

        {/* Estilos de animación */}
        <style jsx>{`
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes bounce-soft {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }

          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
          }

          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(-5px);
            }
            75% {
              transform: translateX(5px);
            }
          }

          .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .animate-slide-down {
            animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .animate-fade-in {
            animation: fade-in 0.4s ease-out both;
          }

          .animate-bounce-soft {
            animation: bounce-soft 2s ease-in-out infinite;
          }

          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }

          .animate-shake {
            animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
          }
        `}</style>
      </Modal>

      {tipo !== 'TORNILLERIA' && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScanned}
        />
      )}
    </>
  )
}