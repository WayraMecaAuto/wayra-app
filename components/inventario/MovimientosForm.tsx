'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Package, AlertCircle, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: any
  restrictToSales?: boolean
}

interface MovementFormData {
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: string
  motivo: string
  precioUnitario?: string
  precioVentaManual?: string
}

export function MovementForm({ isOpen, onClose, onSuccess, product, restrictToSales = false }: MovementFormProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const ROLES_ENTRADA = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS']
  const ROLES_SALIDA = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'ADMIN_WAYRA_PRODUCTOS', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_WAYRA', 'VENDEDOR_TORNI']

  const userRole = session?.user?.role || ''
  const canEnter = ROLES_ENTRADA.includes(userRole)
  const canExit = ROLES_SALIDA.includes(userRole)
  const onlySales = !canEnter || restrictToSales

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<MovementFormData>({
    defaultValues: {
      tipo: onlySales ? 'SALIDA' : 'ENTRADA',
      cantidad: '1',
      motivo: '',
      precioUnitario: '',
      precioVentaManual: product?.precioVenta?.toString() || ''
    }
  })

  const tipo = watch('tipo')
  const cantidad = watch('cantidad')
  const precioVentaManual = watch('precioVentaManual')

  const onSubmit = async (data: MovementFormData) => {
    setIsLoading(true)
    try {
      // Crear movimiento de inventario
      const movResponse = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: product.id,
          tipo: data.tipo,
          cantidad: parseInt(data.cantidad),
          motivo: data.motivo,
          precioUnitario: data.precioUnitario && data.precioUnitario !== '' ? parseFloat(data.precioUnitario) : null
        })
      })

      if (!movResponse.ok) {
        const error = await movResponse.json()
        toast.error(error.error || 'Error al registrar movimiento')
        setIsLoading(false)
        return
      }

      // Si es salida/venta, registrar en contabilidad
      if (data.tipo === 'SALIDA') {
        const precioVenta = data.precioVentaManual ? parseFloat(data.precioVentaManual) : product.precioVenta
        const cantidadNum = parseInt(data.cantidad)

        // Determinar entidad según el tipo de producto
        let entidad = 'WAYRA_PRODUCTOS'
        if (product.tipo === 'TORNI_REPUESTO') {
          entidad = 'TORNI_REPUESTOS'
        } else if (product.tipo === 'TORNILLERIA') {
          entidad = 'TORNI_REPUESTOS'
        }

        const contabilidadResponse = await fetch('/api/contabilidad/crear-ingreso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productoId: product.id,
            cantidad: cantidadNum,
            precioCompra: product.precioCompra,
            precioVenta: precioVenta,
            descripcion: data.motivo,
            entidad: entidad,
            esDesdeOrden: false
          })
        })

        if (!contabilidadResponse.ok) {
          console.error('Error al registrar contabilidad:', await contabilidadResponse.json())
        }
      }

      toast.success('Movimiento registrado exitosamente')
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar movimiento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const getNewStock = () => {
    if (!cantidad || !product) return product?.stock || 0
    
    const cantidadNum = parseInt(cantidad)
    if (isNaN(cantidadNum)) return product?.stock || 0
    
    switch (tipo) {
      case 'ENTRADA':
        return (product.stock || 0) + cantidadNum
      case 'SALIDA':
        return Math.max(0, (product.stock || 0) - cantidadNum)
      default:
        return product.stock || 0
    }
  }

  if (!product) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Movimiento de Inventario" 
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
        {/* Información del producto */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-200">
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">{product.nombre}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Código: {product.codigo}</p>
              {product.descripcion && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.descripcion}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5">Stock</div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{product.stock}</div>
              <div className="text-xs text-gray-500">Mín: {product.stockMinimo}</div>
            </div>
          </div>
        </div>

        {/* Tipo de movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Movimiento *
          </label>
          <div className={`grid ${onlySales ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
            {canEnter && !restrictToSales && (
              <label className="relative cursor-pointer group">
                <input
                  {...register('tipo', { required: 'Selecciona un tipo' })}
                  type="radio"
                  value="ENTRADA"
                  className="sr-only"
                />
                <div className={`
                  border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 hover:scale-[1.02] active:scale-95
                  ${watch('tipo') === 'ENTRADA'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg shadow-green-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }
                `}>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      watch('tipo') === 'ENTRADA' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold mb-0.5">Entrada</div>
                  <div className="text-xs sm:text-sm opacity-75">Agregar stock</div>
                </div>
              </label>
            )}

            {canExit && (
              <label className="relative cursor-pointer group">
                <input
                  {...register('tipo', { required: 'Selecciona un tipo' })}
                  type="radio"
                  value="SALIDA"
                  className="sr-only"
                />
                <div className={`
                  border-2 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center transition-all duration-300 hover:scale-[1.02] active:scale-95
                  ${watch('tipo') === 'SALIDA'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg shadow-red-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }
                `}>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      watch('tipo') === 'SALIDA' ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold mb-0.5">Salida</div>
                  <div className="text-xs sm:text-sm opacity-75">
                    {onlySales ? 'Venta de producto' : 'Reducir stock'}
                  </div>
                </div>
              </label>
            )}
          </div>

          {onlySales && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium text-blue-800 leading-relaxed">
                  {['VENDEDOR_WAYRA', 'VENDEDOR_TORNI'].includes(userRole)
                    ? 'Como vendedor, solo puedes registrar salidas (ventas)'
                    : 'Solo puedes realizar salidas'}
                </span>
              </div>
            </div>
          )}

          {errors.tipo && (
            <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              {errors.tipo.message}
            </p>
          )}
        </div>

        {/* Campos de entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className={tipo === 'ENTRADA' && canEnter ? '' : 'sm:col-span-2'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <Input
              {...register('cantidad', { 
                required: 'La cantidad es requerida',
                pattern: {
                  value: /^\d+$/,
                  message: 'Solo números enteros'
                },
                validate: (value) => {
                  const num = parseInt(value)
                  if (num <= 0) return 'La cantidad debe ser mayor a 0'
                  if (tipo === 'SALIDA' && num > product.stock) {
                    return `Stock insuficiente (disponible: ${product.stock})`
                  }
                  return true
                }
              })}
              type="number"
              min="1"
              placeholder="Ingresa la cantidad"
              className={`h-11 sm:h-12 text-base sm:text-lg font-semibold ${errors.cantidad ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`}
            />
            {errors.cantidad && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="leading-relaxed">{errors.cantidad.message}</span>
              </p>
            )}
          </div>

          {tipo === 'ENTRADA' && canEnter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Unitario <span className="text-gray-400 text-xs">(Opcional)</span>
              </label>
              <Input
                {...register('precioUnitario')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="h-11 sm:h-12 text-base sm:text-lg font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {tipo === 'SALIDA' && onlySales && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Venta <span className="text-gray-400 text-xs">(Editable)</span>
              </label>
              <Input
                {...register('precioVentaManual')}
                type="number"
                step="0.01"
                placeholder={product.precioVenta?.toString()}
                className="h-11 sm:h-12 text-base sm:text-lg font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Por defecto: ${product.precioVenta?.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo *
          </label>
          <Input
            {...register('motivo', { required: 'El motivo es requerido' })}
            placeholder={onlySales ? "Ej: Venta a cliente, Orden #123" : "Ej: Compra, Venta, Devolución, Ajuste"}
            className={`h-11 sm:h-12 text-sm sm:text-base ${errors.motivo ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.motivo && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="leading-relaxed">{errors.motivo.message}</span>
            </p>
          )}
        </div>

        {/* Preview del nuevo stock */}
        {cantidad && !isNaN(parseInt(cantidad)) && (
          <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 ${
            tipo === 'ENTRADA' ? 'bg-green-50 border-green-200' : 
            tipo === 'SALIDA' ? 'bg-red-50 border-red-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {tipo === 'ENTRADA' ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                ) : tipo === 'SALIDA' ? (
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
                ) : (
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                )}
                <span className="text-base sm:text-lg font-semibold text-gray-800">Nuevo Stock:</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 justify-center sm:justify-end">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600">Actual</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">{product.stock}</div>
                </div>
                <div className="text-xl sm:text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600">Nuevo</div>
                  <div className={`text-xl sm:text-2xl font-bold ${
                    tipo === 'ENTRADA' ? 'text-green-600' : 
                    tipo === 'SALIDA' ? 'text-red-600' : 
                    'text-blue-600'
                  }`}>
                    {getNewStock()}
                  </div>
                </div>
              </div>
            </div>
            
            {getNewStock() <= product.stockMinimo && (
              <div className="mt-3 p-2.5 sm:p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-800 leading-relaxed">
                    ⚠️ El nuevo stock estará por debajo del mínimo ({product.stockMinimo})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-5 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2.5 h-11 sm:h-12 text-sm sm:text-base font-medium w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2.5 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg w-full sm:w-auto active:scale-95 transition-transform ${
              tipo === 'ENTRADA' 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrar {tipo === 'ENTRADA' ? 'Entrada' : onlySales ? 'Venta' : 'Salida'}</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}