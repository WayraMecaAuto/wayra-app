'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PriceUpdate {
  productosActualizados: number
  timestamp: string
  tipo?: string
}

export function PriceUpdateNotifier() {
  const [update, setUpdate] = useState<PriceUpdate | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handlePriceUpdate = (event: CustomEvent<PriceUpdate>) => {
      if (event.detail.productosActualizados > 0) {
        setUpdate(event.detail)
        setIsVisible(true)

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
          setIsVisible(false)
        }, 5000)
      }
    }

    window.addEventListener('price-update' as any, handlePriceUpdate)

    return () => {
      window.removeEventListener('price-update' as any, handlePriceUpdate)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && update && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed top-0 left-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-green-600 animate-spin" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Precios Actualizados
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {update.productosActualizados} producto{update.productosActualizados !== 1 ? 's' : ''} {update.productosActualizados !== 1 ? 'han' : 'ha'} sido recalculado{update.productosActualizados !== 1 ? 's' : ''} automáticamente
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(update.timestamp).toLocaleTimeString('es-CO')}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-shrink-0 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Barra de progreso de auto-cerrado */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-green-500 rounded-full mt-3"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}