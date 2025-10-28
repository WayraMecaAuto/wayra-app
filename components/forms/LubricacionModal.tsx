import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Droplets, Filter, Package, AlertCircle, CheckCircle2, Scan, Box, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

interface LubricacionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (aceiteId: string, filtroId: string) => void
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

export function LubricacionModal({ isOpen, onClose, onAdd }: LubricacionModalProps) {
  const [aceites, setAceites] = useState<Producto[]>([])
  const [filtros, setFiltros] = useState<Producto[]>([])
  const [selectedAceite, setSelectedAceite] = useState<Producto | null>(null)
  const [selectedFiltro, setSelectedFiltro] = useState<Producto | null>(null)
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
      // Obtener productos de WAYRA_ENI, WAYRA_CALAN y TorniRepuesto
      const [wayraEniResponse, wayraCalanResponse, torniLubricantesResponse, torniFiltrosResponse] = await Promise.all([
        fetch('/api/productos?tipo=WAYRA_ENI').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=WAYRA_CALAN').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=LUBRICANTES').then(r => r.ok ? r.json() : []),
        fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=FILTROS').then(r => r.ok ? r.json() : [])
      ])

      // Para WAYRA_ENI y WAYRA_CALAN, filtrar por nombre/categoría
      const wayraEniProductos = wayraEniResponse.map((p: any) => ({ ...p, tipo: 'WAYRA_ENI' }))
      const wayraCalanProductos = wayraCalanResponse.map((p: any) => ({ ...p, tipo: 'WAYRA_CALAN' }))

      // Separar lubricantes de WAYRA (los que NO son filtros)
      const wayraLubricantes = [...wayraEniProductos, ...wayraCalanProductos].filter(p => {
        const nombre = p.nombre?.toLowerCase() || ''
        const categoria = p.categoria?.toLowerCase() || ''
        return !nombre.includes('filtro') && !categoria.includes('filtro') && p.stock > 0
      })

      // Separar filtros de WAYRA (los que SÍ son filtros)
      const wayraFiltros = [...wayraEniProductos, ...wayraCalanProductos].filter(p => {
        const nombre = p.nombre?.toLowerCase() || ''
        const categoria = p.categoria?.toLowerCase() || ''
        return (nombre.includes('filtro') || categoria.includes('filtro')) && p.stock > 0
      })

      // TorniRepuesto ya viene filtrado por categoría desde el API
      const torniLubricantes = torniLubricantesResponse.map((p: any) => ({ ...p, tipo: 'TORNI_REPUESTO' })).filter((p: any) => p.stock > 0)
      const torniFiltros = torniFiltrosResponse.map((p: any) => ({ ...p, tipo: 'TORNI_REPUESTO' })).filter((p: any) => p.stock > 0)

      // Combinar todos los lubricantes y filtros
      setAceites([...wayraLubricantes, ...torniLubricantes])
      setFiltros([...wayraFiltros, ...torniFiltros])
    } catch (error) {
      console.error('Error fetching productos:', error)
      toast.error('Error al cargar productos del inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedAceite || !selectedFiltro) {
      toast.error('Debes seleccionar tanto el aceite como el filtro')
      return
    }

    onAdd(selectedAceite.id, selectedFiltro.id)
    handleClose()
  }

  const handleClose = () => {
    setSelectedAceite(null)
    setSelectedFiltro(null)
    setSearchAceite('')
    setSearchFiltro('')
    onClose()
  }

  const filteredAceites = aceites.filter(a => 
    a.nombre.toLowerCase().includes(searchAceite.toLowerCase()) ||
    a.codigo.toLowerCase().includes(searchAceite.toLowerCase())
  )

  const filteredFiltros = filtros.filter(f => 
    f.nombre.toLowerCase().includes(searchFiltro.toLowerCase()) ||
    f.codigo.toLowerCase().includes(searchFiltro.toLowerCase())
  )

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

  const calcularPrecioTotal = () => {
    if (!selectedAceite || !selectedFiltro) return 0
    return selectedAceite.precioVenta + selectedFiltro.precioVenta
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Servicio de Lubricación" size="lg">
        <div className="space-y-6">
          {/* Información del servicio */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-2 text-lg">Servicio de Lubricación</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Selecciona el <span className="font-semibold">aceite</span> y el <span className="font-semibold">filtro de aceite</span> específicos que se utilizarán en este servicio.
                  El precio del servicio será la suma de ambos productos.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Cargando productos del inventario...</p>
                <p className="text-sm text-gray-500">Wayra Eni, Wayra Calán y TorniRepuestos</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selección de Aceite */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <label className="text-base font-semibold text-gray-800">
                      1. Aceite Lubricante *
                    </label>
                  </div>
                </div>

                {selectedAceite ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-green-900 mb-1">{selectedAceite.nombre}</h5>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="text-green-700">Código: <span className="font-mono font-medium">{selectedAceite.codigo}</span></span>
                            <span className="text-green-700">Stock: <span className="font-semibold">{selectedAceite.stock}</span></span>
                            <span className="text-green-700 font-bold">Precio: ${selectedAceite.precioVenta.toLocaleString()}</span>
                            {selectedAceite.tipo && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getInventarioColor(selectedAceite.tipo)}`}>
                                {getInventarioLabel(selectedAceite.tipo)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAceite(null)}
                        className="text-green-700 hover:text-green-900 hover:bg-green-100"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar aceite por nombre o código..."
                        value={searchAceite}
                        onChange={(e) => setSearchAceite(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl bg-gray-50">
                      {filteredAceites.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {filteredAceites.map(aceite => (
                            <button
                              key={aceite.id}
                              onClick={() => setSelectedAceite(aceite)}
                              className="w-full text-left p-4 hover:bg-blue-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
                                    {aceite.nombre}
                                  </h5>
                                  <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="text-gray-600">
                                      Código: <span className="font-mono">{aceite.codigo}</span>
                                    </span>
                                    <span className={`font-medium ${aceite.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      Stock: {aceite.stock}
                                    </span>
                                    <span className="font-bold text-blue-600">
                                      ${aceite.precioVenta.toLocaleString()}
                                    </span>
                                    {aceite.tipo && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getInventarioColor(aceite.tipo)}`}>
                                        {getInventarioLabel(aceite.tipo)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Scan className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Box className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No se encontraron aceites</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchAceite ? 'Intenta con otra búsqueda' : 'No hay aceites disponibles en stock'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Separador visual */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-gray-500 font-medium">y</span>
                </div>
              </div>

              {/* Selección de Filtro */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Filter className="h-4 w-4 text-green-600" />
                    </div>
                    <label className="text-base font-semibold text-gray-800">
                      2. Filtro de Aceite *
                    </label>
                  </div>
                </div>

                {selectedFiltro ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-green-900 mb-1">{selectedFiltro.nombre}</h5>
                          <div className="flex flex-wrap gap-2 text-sm">
                            <span className="text-green-700">Código: <span className="font-mono font-medium">{selectedFiltro.codigo}</span></span>
                            <span className="text-green-700">Stock: <span className="font-semibold">{selectedFiltro.stock}</span></span>
                            <span className="text-green-700 font-bold">Precio: ${selectedFiltro.precioVenta.toLocaleString()}</span>
                            {selectedFiltro.tipo && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getInventarioColor(selectedFiltro.tipo)}`}>
                                {getInventarioLabel(selectedFiltro.tipo)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiltro(null)}
                        className="text-green-700 hover:text-green-900 hover:bg-green-100"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar filtro por nombre o código..."
                        value={searchFiltro}
                        onChange={(e) => setSearchFiltro(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl bg-gray-50">
                      {filteredFiltros.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {filteredFiltros.map(filtro => (
                            <button
                              key={filtro.id}
                              onClick={() => setSelectedFiltro(filtro)}
                              className="w-full text-left p-4 hover:bg-green-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 group-hover:text-green-700 mb-1">
                                    {filtro.nombre}
                                  </h5>
                                  <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="text-gray-600">
                                      Código: <span className="font-mono">{filtro.codigo}</span>
                                    </span>
                                    <span className={`font-medium ${filtro.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                      Stock: {filtro.stock}
                                    </span>
                                    <span className="font-bold text-green-600">
                                      ${filtro.precioVenta.toLocaleString()}
                                    </span>
                                    {filtro.tipo && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getInventarioColor(filtro.tipo)}`}>
                                        {getInventarioLabel(filtro.tipo)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Scan className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Box className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No se encontraron filtros</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchFiltro ? 'Intenta con otra búsqueda' : 'No hay filtros disponibles en stock'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de selección con precio total */}
              {selectedAceite && selectedFiltro && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-xl p-5 shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-green-900 mb-3 text-lg">Productos Seleccionados:</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center space-x-2">
                            <Droplets className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-700">Aceite:</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{selectedAceite.nombre}</div>
                            <div className="text-sm text-blue-600 font-bold">${selectedAceite.precioVenta.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-700">Filtro:</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{selectedFiltro.nombre}</div>
                            <div className="text-sm text-green-600 font-bold">${selectedFiltro.precioVenta.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300 mt-3">
                          <span className="font-bold text-green-900 text-lg">Precio Total del Servicio:</span>
                          <span className="text-2xl font-bold text-green-700">${calcularPrecioTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de advertencia si falta selección */}
              {(!selectedAceite || !selectedFiltro) && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Selección incompleta
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Debes seleccionar tanto el aceite como el filtro para continuar
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="px-6 py-3 border-2 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedAceite || !selectedFiltro || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}