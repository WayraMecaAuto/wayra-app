'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
}

export function MovementForm({ isOpen, onClose, onSuccess, product, restrictToSales = false }: MovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<MovementFormData>({
    defaultValues: {
      tipo: restrictToSales ? 'SALIDA' : 'ENTRADA',
      cantidad: '1',
      motivo: '',
      precioUnitario: ''
    }
  })
  
  const tipo = watch('tipo')
  const cantidad = watch('cantidad')

  const onSubmit = async (data: MovementFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/movimientos', {
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

      if (response.ok) {
        toast.success('Movimiento registrado exitosamente')
        onSuccess()
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al registrar movimiento')
      }
    } catch (error) {
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
      <div className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Información del producto */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-xl">{product.nombre}</h4>
                <p className="text-sm text-gray-600 mt-1">Código: {product.codigo}</p>
                {product.descripcion && (
                  <p className="text-xs text-gray-500 mt-1">{product.descripcion}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Stock Actual</div>
                <div className="text-4xl font-bold text-blue-600">{product.stock}</div>
                <div className="text-xs text-gray-500">Mín: {product.stockMinimo}</div>
              </div>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Tipo de Movimiento *
            </label>
            <div className={`grid ${restrictToSales ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {!restrictToSales && (
              <label className="relative cursor-pointer group">
                <input
                  {...register('tipo', { required: 'Selecciona un tipo' })}
                  type="radio"
                  value="ENTRADA"
                  className="sr-only"
                />
                <div className={`
                  border-2 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 group-hover:shadow-lg
                  ${watch('tipo') === 'ENTRADA'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg shadow-green-500/25' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }
                `}>
                  <div className="flex items-center justify-center mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      watch('tipo') === 'ENTRADA' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <ArrowUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-lg font-bold mb-1">Entrada</div>
                  <div className="text-sm opacity-75">Agregar stock al inventario</div>
                </div>
              </label>
              )}

              <label className="relative cursor-pointer group">
                <input
                  {...register('tipo', { required: 'Selecciona un tipo' })}
                  type="radio"
                  value="SALIDA"
                  className="sr-only"
                />
                <div className={`
                  border-2 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 group-hover:shadow-lg
                  ${watch('tipo') === 'SALIDA'
                    ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg shadow-red-500/25' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }
                `}>
                  <div className="flex items-center justify-center mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      watch('tipo') === 'SALIDA' ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      <ArrowDown className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-lg font-bold mb-1">Salida</div>
                  <div className="text-sm opacity-75">Reducir stock del inventario</div>
                </div>
              </label>
            </div>
            {restrictToSales && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Como vendedor, solo puedes realizar salidas de inventario
                  </span>
                </div>
              </div>
            )}
            {errors.tipo && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.tipo.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cantidad */}
            <div>
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
                className={`h-12 text-lg font-semibold ${errors.cantidad ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`}
                style={{ 
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }}
              />
              {errors.cantidad && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.cantidad.message}
                </p>
              )}
            </div>

            {/* Precio unitario (opcional para entradas) */}
            {tipo === 'ENTRADA' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario (Opcional)
                </label>
                <Input
                  {...register('precioUnitario')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-12 text-lg font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  style={{ 
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none'
                  }}
                />
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
              placeholder="Ej: Compra de mercancía, Venta, Devolución, Ajuste de inventario"
              className={`h-12 ${errors.motivo ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-blue-500`}
            />
            {errors.motivo && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.motivo.message}
              </p>
            )}
          </div>

          {/* Preview del nuevo stock */}
          {cantidad && !isNaN(parseInt(cantidad)) && (
            <div className={`p-6 rounded-2xl border-2 ${
              tipo === 'ENTRADA' ? 'bg-green-50 border-green-200' : 
              tipo === 'SALIDA' ? 'bg-red-50 border-red-200' : 
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {tipo === 'ENTRADA' ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : tipo === 'SALIDA' ? (
                    <Info className="h-6 w-6 text-red-600" />
                  ) : (
                    <Info className="h-6 w-6 text-blue-600" />
                  )}
                  <span className="text-lg font-semibold text-gray-800">Nuevo Stock:</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Actual</div>
                    <div className="text-2xl font-bold text-gray-700">{product.stock}</div>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Nuevo</div>
                    <div className={`text-2xl font-bold ${
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
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      ⚠️ El nuevo stock estará por debajo del mínimo ({product.stockMinimo})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-8 py-3 h-12"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-3 h-12 shadow-lg ${
                tipo === 'ENTRADA' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {isLoading ? 'Registrando...' : `Registrar ${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}`}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}