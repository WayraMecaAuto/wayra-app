'use client'

import { useState } from 'react'
import { Modal } from '../ui/modal'
import { ArrowUp, ArrowDown, Package, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface MovementFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: any
}

interface MovementFormData {
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: string
  motivo: string
  precioUnitario?: string
}

export function MovementForm({ isOpen, onClose, onSuccess, product }: MovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<MovementFormData>({
    tipo: 'ENTRADA',
    cantidad: '1',
    motivo: '',
    precioUnitario: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof MovementFormData, string>>>({})

  // Para demo - en producción vendría de la sesión
  const isVendedor = false

  const validate = () => {
    const newErrors: Partial<Record<keyof MovementFormData, string>> = {}
    
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0'
    }
    
    if (formData.tipo === 'SALIDA' && parseInt(formData.cantidad) > product.stock) {
      newErrors.cantidad = `Stock insuficiente (disponible: ${product.stock})`
    }
    
    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsLoading(true)
    
    // Simular envío
    setTimeout(() => {
      console.log('Movimiento registrado:', formData)
      setIsLoading(false)
      handleClose()
      onSuccess()
    }, 1500)
  }

  const handleClose = () => {
    setFormData({
      tipo: isVendedor ? 'SALIDA' : 'ENTRADA',
      cantidad: '1',
      motivo: '',
      precioUnitario: ''
    })
    setErrors({})
    onClose()
  }

  const getNewStock = () => {
    if (!formData.cantidad || !product) return product?.stock || 0
    
    const cantidadNum = parseInt(formData.cantidad)
    if (isNaN(cantidadNum)) return product?.stock || 0
    
    switch (formData.tipo) {
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
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Información del producto */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-lg sm:text-xl truncate">{product.nombre}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Código: {product.codigo}</p>
              {product.descripcion && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.descripcion}</p>
              )}
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Stock Actual</div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">{product.stock}</div>
              <div className="text-xs text-gray-500">Mín: {product.stockMinimo}</div>
            </div>
          </div>
        </div>

        {/* Tipo de movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Movimiento *
          </label>
          <div className={`grid ${isVendedor ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
            {!isVendedor && (
              <label className="relative cursor-pointer group">
                <input
                  type="radio"
                  value="ENTRADA"
                  checked={formData.tipo === 'ENTRADA'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'ENTRADA' })}
                  className="sr-only"
                />
                <div className={`
                  border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 hover:scale-105 group-hover:shadow-lg
                  ${formData.tipo === 'ENTRADA'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg shadow-green-500/25' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }
                `}>
                  <div className="flex items-center justify-center mb-2 sm:mb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      formData.tipo === 'ENTRADA' ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold mb-1">Entrada</div>
                  <div className="text-xs sm:text-sm opacity-75">Agregar stock</div>
                </div>
              </label>
            )}

            <label className="relative cursor-pointer group">
              <input
                type="radio"
                value="SALIDA"
                checked={formData.tipo === 'SALIDA'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'SALIDA' })}
                className="sr-only"
              />
              <div className={`
                border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 hover:scale-105 group-hover:shadow-lg
                ${formData.tipo === 'SALIDA'
                  ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg shadow-red-500/25' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                }
              `}>
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                    formData.tipo === 'SALIDA' ? 'bg-red-500' : 'bg-gray-400'
                  }`}>
                    <ArrowDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold mb-1">Salida</div>
                <div className="text-xs sm:text-sm opacity-75">
                  {isVendedor ? 'Venta de producto' : 'Reducir stock'}
                </div>
              </div>
            </label>
          </div>
          
          {isVendedor && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm font-medium text-yellow-800">
                  Como vendedor, solo puedes realizar salidas de inventario
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              placeholder="Ingresa la cantidad"
              className={`w-full h-11 sm:h-12 px-4 text-base sm:text-lg font-semibold border-2 rounded-xl focus:outline-none focus:ring-2 ${
                errors.cantidad 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />
            {errors.cantidad && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                {errors.cantidad}
              </p>
            )}
          </div>

          {/* Precio unitario (opcional para entradas) */}
          {formData.tipo === 'ENTRADA' && !isVendedor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Unitario (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.precioUnitario}
                onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                placeholder="0.00"
                className="w-full h-11 sm:h-12 px-4 text-base sm:text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo *
          </label>
          <input
            type="text"
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            placeholder={isVendedor ? "Ej: Venta a cliente, Orden #123" : "Ej: Compra, Venta, Devolución"}
            className={`w-full h-11 sm:h-12 px-4 text-sm sm:text-base border-2 rounded-xl focus:outline-none focus:ring-2 ${
              errors.motivo 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
          {errors.motivo && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              {errors.motivo}
            </p>
          )}
        </div>

        {/* Preview del nuevo stock */}
        {formData.cantidad && !isNaN(parseInt(formData.cantidad)) && (
          <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${
            formData.tipo === 'ENTRADA' ? 'bg-green-50 border-green-200' : 
            formData.tipo === 'SALIDA' ? 'bg-red-50 border-red-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {formData.tipo === 'ENTRADA' ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                ) : formData.tipo === 'SALIDA' ? (
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
                ) : (
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                )}
                <span className="text-base sm:text-lg font-semibold text-gray-800">Nuevo Stock:</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600">Actual</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">{product.stock}</div>
                </div>
                <div className="text-xl sm:text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600">Nuevo</div>
                  <div className={`text-xl sm:text-2xl font-bold ${
                    formData.tipo === 'ENTRADA' ? 'text-green-600' : 
                    formData.tipo === 'SALIDA' ? 'text-red-600' : 
                    'text-blue-600'
                  }`}>
                    {getNewStock()}
                  </div>
                </div>
              </div>
            </div>
            
            {getNewStock() <= product.stockMinimo && (
              <div className="mt-3 sm:mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-800">
                    ⚠️ El nuevo stock estará por debajo del mínimo ({product.stockMinimo})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 h-11 sm:h-12 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 h-11 sm:h-12 text-white font-semibold rounded-xl shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center ${
              formData.tipo === 'ENTRADA' 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
            }`}
          >
            {isLoading && (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            {isLoading ? 'Registrando...' : `Registrar ${formData.tipo === 'ENTRADA' ? 'Entrada' : isVendedor ? 'Venta' : 'Salida'}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Demo Component
export default function MovementFormDemo() {
  const [isOpen, setIsOpen] = useState(false)

  const demoProduct = {
    id: 1,
    nombre: 'Repuesto Premium XL',
    codigo: 'RP-001',
    descripcion: 'Repuesto de alta calidad para vehículos',
    stock: 25,
    stockMinimo: 10
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Formulario de Movimientos Adaptado
          </h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
            Responsive y optimizado para todos los dispositivos
          </p>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Abrir Formulario de Movimiento
          </button>

          <div className="mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Mejoras aplicadas:</h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Layout responsive optimizado para móviles, tablets y desktop</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Tamaños de texto y espaciado adaptables</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Botones apilados en móvil, en fila en desktop</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Tarjetas de tipo de movimiento en una columna en móvil</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Modal de tamaño 'lg' para mejor visualización del contenido</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <MovementForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => console.log('Movimiento registrado exitosamente')}
        product={demoProduct}
      />
    </div>
  )
}