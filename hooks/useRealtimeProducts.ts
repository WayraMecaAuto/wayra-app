import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  codigo: string
  codigoBarras: string
  nombre: string
  descripcion?: string
  precioCompra: number
  precioVenta: number
  precioMinorista: number
  precioMayorista: number
  stock: number
  stockMinimo: number
  aplicaIva: boolean
  isActive: boolean
  createdAt: string
}

interface UseRealtimeProductsOptions {
  tipo?: string
  categoria?: string
  pollingInterval?: number // en milisegundos, default 30000 (30 segundos)
}

export function useRealtimeProducts(options: UseRealtimeProductsOptions = {}) {
  const { tipo, categoria, pollingInterval = 30000 } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (tipo) params.append('tipo', tipo)
      if (categoria) params.append('categoria', categoria)

      const response = await fetch(`/api/productos?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [tipo, categoria])

  // Fetch inicial
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Polling periódico
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts()
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [fetchProducts, pollingInterval])

  // Escuchar eventos de actualización de configuración
  useEffect(() => {
    const handleConfigUpdate = () => {
      console.log('🔄 Configuración actualizada, refrescando productos...')
      fetchProducts()
    }

    window.addEventListener('config-updated', handleConfigUpdate)
    
    return () => {
      window.removeEventListener('config-updated', handleConfigUpdate)
    }
  }, [fetchProducts])

  // Método manual de refresco
  const refresh = useCallback(() => {
    return fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    lastUpdate,
    refresh
  }
}