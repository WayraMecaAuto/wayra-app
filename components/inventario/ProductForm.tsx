'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { BarcodeDisplay } from '@/components/ui/barcode-display'
import Dropdown from '@/components/forms/Dropdown' 
import { 
  Camera, DollarSign, Package, Sparkles, Eye, EyeOff, 
  Settings, ShoppingCart, TrendingUp, Package2 
} from 'lucide-react'
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
  monedaCompra: 'COP' | 'USD'
  aplicaIva: boolean
  stockMinimo: string
  stockInicial: string
}

const monedaOptions = [
  { value: 'COP', label: 'COP (Pesos Colombianos)' },
  { value: 'USD', label: 'USD (Dólares Americanos)' },
]

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
  const [showBarcodePreview, setShowBarcodePreview] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ProductFormData>()
  
  const precioCompra = watch('precioCompra')
  const aplicaIva = watch('aplicaIva')
  const monedaCompra = watch('monedaCompra') || 'COP'

  const config = getPricingConfig(tipo as any, categoria)
  const esCalan = tipo === 'WAYRA_CALAN'

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
      
      setValue('monedaCompra', esCalan ? 'USD' : 'COP')
      setValue('stockInicial', '0')
      setValue('stockMinimo', '5')
      setValue('aplicaIva', config.ivaObligatorio)
    }
  }, [product, isOpen, tipo, categoria, esCalan, setValue, config.ivaObligatorio])

  useEffect(() => {
    if (precioCompra && parseFloat(precioCompra) > 0) {
      const prices = calculatePrices(
        parseFloat(precioCompra),
        tipo as any,
        categoria,
        aplicaIva,
        4000
      )
      setPreviewPrices(prices)
    } else {
      setPreviewPrices(null)
    }
  }, [precioCompra, aplicaIva, tipo, categoria])

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
          stockInicial: parseInt(data.stockInicial || '0')
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={product ? 'Editar Producto' : 'Nuevo Producto'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* Header elegante */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-inner">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Package2 className="h-9 w-9 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {tipo === 'WAYRA_ENI' ? 'Wayra ENI' : 
                   tipo === 'WAYRA_CALAN' ? 'Wayra CALAN' :
                   tipo === 'TORNILLERIA' ? 'Tornillería' : 
                   `TorniRepuestos - ${categoria}`}
                </h3>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold shadow-sm">
                    Margen: {config.margenGanancia}%
                  </span>
                  <span className="px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold shadow-sm">
                    IVA: {config.porcentajeIva}% {config.ivaObligatorio ? '(Oblig.)' : '(Opc.)'}
                  </span>
                  {esCalan && (
                    <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold shadow-sm">
                      Precios en USD
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">

            {/* Columna Izquierda - Información Básica */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Información Básica</h3>
              </div>

              {/* Código */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código del Producto *</label>
                <Input
                  {...register('codigo', { required: 'El código es requerido' })}
                  placeholder="Ej: WE123456"
                  className="h-12 text-base font-mono font-bold border-2 rounded-xl focus:ring-4 focus:ring-purple-100"
                />
                {errors.codigo && <p className="mt-2 text-sm text-red-600">{errors.codigo.message}</p>}
              </div>

              {/* Código de Barras */}
              {tipo !== 'TORNILLERIA' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Barras</label>
                  <div className="flex gap-3">
                    <Input
                      {...register('codigoBarras')}
                      placeholder="Escanee o genere automáticamente"
                      className="h-12 font-mono border-2 rounded-xl"
                    />
                    <Button type="button" onClick={() => setShowScanner(true)} size="icon" className="h-12 w-12 rounded-xl">
                      <Camera className="h-5 w-5" />
                    </Button>
                    {watch('codigoBarras') && (
                      <Button type="button" onClick={() => setShowBarcodePreview(!showBarcodePreview)} size="icon" variant="outline" className="h-12 w-12 rounded-xl">
                        {showBarcodePreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Producto *</label>
                <Input
                  {...register('nombre', { required: 'El nombre es requerido' })}
                  placeholder="Ej: Filtro de aceite Toyota Corolla"
                  className="h-12 text-base font-semibold border-2 rounded-xl focus:ring-4 focus:ring-purple-100"
                />
                {errors.nombre && <p className="mt-2 text-sm text-red-600">{errors.nombre.message}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea
                  {...register('descripcion')}
                  rows={4}
                  placeholder="Descripción detallada (opcional)..."
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 resize-none transition-all"
                />
              </div>
            </div>

            {/* Columna Derecha - Precios y Configuración */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Precios y Configuración</h3>
              </div>

              {/* Precio de Compra */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio de Compra * ({monedaCompra})
                </label>
                <Input
                  {...register('precioCompra', { 
                    required: 'El precio es requerido',
                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Formato inválido' }
                  })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-14 text-2xl font-bold border-2 rounded-xl focus:ring-4 focus:ring-emerald-100"
                />
                {errors.precioCompra && <p className="mt-2 text-sm text-red-600">{errors.precioCompra.message}</p>}
              </div>

              {/* Moneda - Solo editable si es CALAN */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda de Compra</label>
                {esCalan ? (
                  <Dropdown
                    options={monedaOptions}
                    value={monedaCompra}
                    onChange={(val) => setValue('monedaCompra', val as 'COP' | 'USD')}
                    icon={monedaCompra === 'USD' ? 'USD' : 'COP'}
                  />
                ) : (
                  <div className="h-12 px-4 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center font-semibold text-gray-700">
                    COP (Pesos Colombianos)
                  </div>
                )}
              </div>

              {/* Configuración Avanzada (colapsable en móvil) */}
              <div className="block lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between rounded-xl"
                >
                  Configuración Avanzada
                  <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>↓</span>
                </Button>
              </div>

              <div className={`${showAdvanced || window.innerWidth >= 1024 ? 'block' : 'hidden lg:block'} space-y-5`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stock Mínimo</label>
                    <Input {...register('stockMinimo')} type="number" className="h-12 mt-2 rounded-xl border-2" defaultValue="5" />
                  </div>
                  {!product && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Stock Inicial</label>
                      <Input {...register('stockInicial')} type="number" className="h-12 mt-2 rounded-xl border-2" defaultValue="0" />
                    </div>
                  )}
                </div>

                {/* IVA */}
                {!config.ivaObligatorio ? (
                  <label className="flex items-center gap-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                    <input type="checkbox" {...register('aplicaIva')} className="w-5 h-5 text-emerald-600 rounded" />
                    <div>
                      <div className="font-semibold">Aplicar IVA ({config.porcentajeIva}%)</div>
                      <div className="text-sm text-gray-600">Se incluirá en todos los precios de venta</div>
                    </div>
                  </label>
                ) : (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-blue-900">IVA {config.porcentajeIva}% aplicado automáticamente</div>
                        <div className="text-sm text-blue-700">Este producto requiere IVA obligatorio</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vista previa de precios */}
          {previewPrices && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <TrendingUp className="h-7 w-7 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-800">Vista Previa de Precios</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { label: 'Venta', price: previewPrices.precioVenta, color: 'emerald' },
                  { label: 'Minorista', price: previewPrices.precioMinorista, color: 'blue' },
                  { label: 'Mayorista', price: previewPrices.precioMayorista, color: 'purple' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 text-center shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className={`w-12 h-12 mx-auto mb-3 bg-${item.color}-500 rounded-xl flex items-center justify-center`}>
                      <ShoppingCart className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-600">{item.label}</div>
                    <div className={`text-2xl font-bold text-${item.color}-600 mt-1`}>
                      ${item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview de código de barras */}
          {tipo !== 'TORNILLERIA' && watch('codigoBarras') && showBarcodePreview && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h4 className="font-bold text-center mb-4 text-lg">Vista Previa del Código de Barras</h4>
              <div className="bg-white p-6 rounded-xl shadow-inner">
                <BarcodeDisplay 
                  value={watch('codigoBarras')} 
                  productName={watch('nombre') || 'Producto sin nombre'}
                  productCode={watch('codigo')}
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="h-12 px-8 rounded-xl text-base font-semibold">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="h-12 px-8 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all">
              {isLoading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  {product ? 'Actualizar Producto' : 'Crear Producto'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {tipo !== 'TORNILLERIA' && (
        <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />
      )}
    </>
  )
}