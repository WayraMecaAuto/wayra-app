import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Droplets, Filter, Package, AlertCircle, CheckCircle2, Scan, Box, ShoppingCart, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface LubricacionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (productos: Array<{ id: string; nombre: string; tipo: 'ACEITE' | 'FILTRO' }>) => void
}

interface Producto {
  id: string
  nombre: string
  codigo: string
  stock: number
  precioVenta: number
  tipo?: string
  categoria?: string
}

interface ProductoSeleccionado {
  id: string
  nombre: string
  codigo: string
  precioVenta: number
  tipo: 'ACEITE' | 'FILTRO'
  inventarioTipo?: string
}

export function LubricacionModal({ isOpen, onClose, onAdd }: LubricacionModalProps) {
  const [aceites, setAceites] = useState<Producto[]>([])
  const [filtros, setFiltros] = useState<Producto[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([])
  const [loading, setLoading] = useState(false)
  const [searchAceite, setSearchAceite] = useState('')
  const [searchFiltro, setSearchFiltro] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProductos()
    }
  }, [isOpen])

  const fetchProductos = async () => {
    setLoading(true)
    try {
      const [wayraEniResponse, wayraCalanResponse, torniLubricantesResponse, torniFiltrosResponse] = await Promise.all([
        fetch('/api/productos?tipo=WAYRA_ENI').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=WAYRA_CALAN').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=LUBRICANTES').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=FILTROS').then(r => r.ok ? r.json() : [])
      ])

      const wayraEniProductos = wayraEniResponse.map((p: any) => ({ ...p, tipo: 'WAYRA_ENI' }))
      const wayraCalanProductos = wayraCalanResponse.map((p: any) => ({ ...p, tipo: 'WAYRA_CALAN' }))

      const wayraLubricantes = [...wayraEniProductos, ...wayraCalanProductos].filter(p => {
        const nombre = p.nombre?.toLowerCase() || ''
        const categoria = p.categoria?.toLowerCase() || ''
        return !nombre.includes('filtro') && !categoria.includes('filtro') && p.stock > 0
      })

      const wayraFiltros = [...wayraEniProductos, ...wayraCalanProductos].filter(p => {
        const nombre = p.nombre?.toLowerCase() || ''
        const categoria = p.categoria?.toLowerCase() || ''
        return (nombre.includes('filtro') || categoria.includes('filtro')) && p.stock > 0
      })

      const torniLubricantes = torniLubricantesResponse.map((p: any) => ({ ...p, tipo: 'TORNI_REPUESTO' })).filter((p: any) => p.stock > 0)
      const torniFiltros = torniFiltrosResponse.map((p: any) => ({ ...p, tipo: 'TORNI_REPUESTO' })).filter((p: any) => p.stock > 0)

      setAceites([...wayraLubricantes, ...torniLubricantes])
      setFiltros([...wayraFiltros, ...torniFiltros])
    } catch (error) {
      console.error('Error fetching productos:', error)
      toast.error('Error al cargar productos del inventario')
    } finally {
      setLoading(false)
    }
  }

  const agregarAceite = (producto: Producto) => {
    if (productosSeleccionados.some(p => p.id === producto.id)) {
      toast.error('Este producto ya está agregado')
      return
    }

    setProductosSeleccionados([
      ...productosSeleccionados,
      {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precioVenta: producto.precioVenta,
        tipo: 'ACEITE',
        inventarioTipo: producto.tipo
      }
    ])
    toast.success('Aceite agregado')
  }

  const agregarFiltro = (producto: Producto) => {
    if (productosSeleccionados.some(p => p.id === producto.id)) {
      toast.error('Este producto ya está agregado')
      return
    }

    setProductosSeleccionados([
      ...productosSeleccionados,
      {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precioVenta: producto.precioVenta,
        tipo: 'FILTRO',
        inventarioTipo: producto.tipo
      }
    ])
    toast.success('Filtro agregado')
  }

  const removerProducto = (id: string) => {
    setProductosSeleccionados(productosSeleccionados.filter(p => p.id !== id))
    toast.success('Producto removido')
  }

  const handleSubmit = () => {
    const aceites = productosSeleccionados.filter(p => p.tipo === 'ACEITE')
    const filtros = productosSeleccionados.filter(p => p.tipo === 'FILTRO')

    if (aceites.length === 0) {
      toast.error('Debes agregar al menos un aceite')
      return
    }

    if (filtros.length === 0) {
      toast.error('Debes agregar al menos un filtro')
      return
    }

    onAdd(productosSeleccionados.map(p => ({ id: p.id, nombre: p.nombre, tipo: p.tipo })))
    handleClose()
  }

  const handleClose = () => {
    setProductosSeleccionados([])
    setSearchAceite('')
    setSearchFiltro('')
    onClose()
  }

  const calcularPrecioTotal = () => {
    return productosSeleccionados.reduce((sum, p) => sum + p.precioVenta, 0)
  }

  const getInventarioLabel = (tipo: string) => {
    if (tipo === 'WAYRA_ENI') return 'Wayra Eni'
    if (tipo === 'WAYRA_CALAN') return 'Wayra Calán'
    return 'TorniRepuestos'
  }

  const getInventarioColor = (tipo: string) => {
    if (tipo === 'WAYRA_ENI') return 'bg-blue-100 text-blue-700'
    if (tipo === 'WAYRA_CALAN') return 'bg-cyan-100 text-cyan-700'
    return 'bg-purple-100 text-purple-700'
  }

  const filteredAceites = aceites.filter(a => 
    a.nombre.toLowerCase().includes(searchAceite.toLowerCase()) ||
    a.codigo.toLowerCase().includes(searchAceite.toLowerCase())
  )

  const filteredFiltros = filtros.filter(f => 
    f.nombre.toLowerCase().includes(searchFiltro.toLowerCase()) ||
    f.codigo.toLowerCase().includes(searchFiltro.toLowerCase())
  )

  const aceitesSeleccionados = productosSeleccionados.filter(p => p.tipo === 'ACEITE')
  const filtrosSeleccionados = productosSeleccionados.filter(p => p.tipo === 'FILTRO')

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Servicio de Lubricación" size="xl">
      <div className="space-y-6">
        {/* Información */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-2">Servicio de Lubricación Personalizado</h4>
              <p className="text-sm text-blue-700">
                Selecciona <span className="font-semibold">uno o más aceites</span> y <span className="font-semibold">uno o más filtros</span> para este servicio.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando productos...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Aceites */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Droplets className="h-4 w-4 text-blue-600" />
                  </div>
                  <label className="font-semibold text-gray-800">Aceites Lubricantes</label>
                </div>
                <span className="text-sm text-gray-600">
                  {aceitesSeleccionados.length} seleccionados
                </span>
              </div>

              {/* Aceites seleccionados */}
              {aceitesSeleccionados.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
                  {aceitesSeleccionados.map(producto => (
                    <div key={producto.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{producto.nombre}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <span>{producto.codigo}</span>
                            <span className="font-bold text-green-600">${producto.precioVenta.toLocaleString()}</span>
                            {producto.inventarioTipo && (
                              <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(producto.inventarioTipo)}`}>
                                {getInventarioLabel(producto.inventarioTipo)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerProducto(producto.id)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Búsqueda aceites */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar aceite..."
                  value={searchAceite}
                  onChange={(e) => setSearchAceite(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Lista aceites */}
              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
                {filteredAceites.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAceites.map(aceite => (
                      <button
                        key={aceite.id}
                        onClick={() => agregarAceite(aceite)}
                        disabled={productosSeleccionados.some(p => p.id === aceite.id)}
                        className="w-full text-left p-3 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 text-sm truncate">{aceite.nombre}</h5>
                            <div className="flex flex-wrap gap-2 text-xs mt-1">
                              <span className="text-gray-600">{aceite.codigo}</span>
                              <span className="text-green-600 font-medium">Stock: {aceite.stock}</span>
                              <span className="font-bold text-blue-600">${aceite.precioVenta.toLocaleString()}</span>
                              {aceite.tipo && (
                                <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(aceite.tipo)}`}>
                                  {getInventarioLabel(aceite.tipo)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No se encontraron aceites</p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Filter className="h-4 w-4 text-green-600" />
                  </div>
                  <label className="font-semibold text-gray-800">Filtros de Aceite</label>
                </div>
                <span className="text-sm text-gray-600">
                  {filtrosSeleccionados.length} seleccionados
                </span>
              </div>

              {/* Filtros seleccionados */}
              {filtrosSeleccionados.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-gray-100">
                  {filtrosSeleccionados.map(producto => (
                    <div key={producto.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{producto.nombre}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <span>{producto.codigo}</span>
                            <span className="font-bold text-green-600">${producto.precioVenta.toLocaleString()}</span>
                            {producto.inventarioTipo && (
                              <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(producto.inventarioTipo)}`}>
                                {getInventarioLabel(producto.inventarioTipo)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerProducto(producto.id)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Búsqueda filtros */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar filtro..."
                  value={searchFiltro}
                  onChange={(e) => setSearchFiltro(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Lista filtros */}
              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-gray-100">
                {filteredFiltros.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredFiltros.map(filtro => (
                      <button
                        key={filtro.id}
                        onClick={() => agregarFiltro(filtro)}
                        disabled={productosSeleccionados.some(p => p.id === filtro.id)}
                        className="w-full text-left p-3 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 text-sm truncate">{filtro.nombre}</h5>
                            <div className="flex flex-wrap gap-2 text-xs mt-1">
                              <span className="text-gray-600">{filtro.codigo}</span>
                              <span className="text-green-600 font-medium">Stock: {filtro.stock}</span>
                              <span className="font-bold text-green-600">${filtro.precioVenta.toLocaleString()}</span>
                              {filtro.tipo && (
                                <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(filtro.tipo)}`}>
                                  {getInventarioLabel(filtro.tipo)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-green-600 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No se encontraron filtros</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {productosSeleccionados.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-bold text-green-900 mb-3">Resumen del Servicio:</h5>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Aceites</div>
                    <div className="text-xl font-bold text-blue-600">{aceitesSeleccionados.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Filtros</div>
                    <div className="text-xl font-bold text-green-600">{filtrosSeleccionados.length}</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-900">Precio Total:</span>
                    <span className="text-2xl font-bold text-green-700">${calcularPrecioTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia */}
        {(aceitesSeleccionados.length === 0 || filtrosSeleccionados.length === 0) && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Selección incompleta</p>
                <p className="text-sm text-amber-700 mt-1">
                  Debes agregar al menos un aceite y un filtro
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={aceitesSeleccionados.length === 0 || filtrosSeleccionados.length === 0 || loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </div>
    </Modal>
  )
}