'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Plus, Search, Edit, Trash2, Package, AlertTriangle, 
  BarChart3, Camera, ArrowUpDown, Eye, Bolt, Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductForm } from '@/components/inventario/ProductForm'
import { MovementForm } from '@/components/inventario/MovimientosForm'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { BarcodeDisplay } from '@/components/ui/barcode-display'
import toast from 'react-hot-toast'

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

export default function TornilleriaPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showBarcodeView, setShowBarcodeView] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/productos?tipo=TORNILLERIA&categoria=TORNILLERIA')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        toast.error('Error al cargar productos')
      }
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await fetch(`/api/productos/barcode/${code}`)
      if (response.ok) {
        const product = await response.json()
        if (product.tipo === 'TORNILLERIA') {
          setSelectedProduct(product)
          setShowMovementForm(true)
        } else {
          toast.error('Este producto no pertenece a Tornillería')
        }
      } else {
        toast.error('Producto no encontrado')
      }
    } catch (error) {
      toast.error('Error al buscar producto')
    }
    setShowScanner(false)
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${productId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Producto eliminado correctamente')
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar producto')
      }
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock <= p.stockMinimo).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.precioVenta), 0),
    allWithIva: products.length // Todos tienen IVA obligatorio
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Bolt className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Tornillería Industrial</h1>
              <p className="text-gray-200 text-lg">Tornillos, tuercas, arandelas y más</p>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">Margen 100%</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">IVA 19% Obligatorio</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">Alta Rotación</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex space-x-3">
            {session?.user?.role === 'ADMIN' && (
              <Button
                onClick={() => setShowProductForm(true)}
                className="bg-white text-gray-800 hover:bg-gray-100 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tornillo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Tornillería
            </CardTitle>
            <Bolt className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">Productos disponibles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{stats.lowStock}</div>
            <p className="text-xs text-orange-600 mt-1">Requieren reposición</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Valor Total
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">Inventario tornillería</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Con IVA
            </CardTitle>
            <Settings className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{stats.allWithIva}</div>
            <p className="text-xs text-blue-600 mt-1">IVA obligatorio</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar tornillos, tuercas, arandelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-0 bg-white shadow-md focus:shadow-lg transition-shadow"
              />
            </div>
            <div className="flex space-x-3 lg:hidden">
              <Button
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="flex-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              >
                <Camera className="h-4 w-4 mr-2" />
                Escanear
              </Button>
              {session?.user?.role === 'ADMIN' && (
                <Button
                  onClick={() => setShowProductForm(true)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-2xl border-0 bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
          <CardTitle className="text-xl flex items-center space-x-2">
            <Bolt className="h-6 w-6" />
            <span>Tornillería Industrial ({filteredProducts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Producto</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Stock</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Precios</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">IVA</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Código de Barras</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr 
                    key={product.id} 
                    className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-25 hover:to-gray-50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md border border-gray-300">
                          <Bolt className="h-6 w-6 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{product.nombre}</div>
                          <div className="text-sm text-gray-500">Código: {product.codigo}</div>
                          {product.descripcion && (
                            <div className="text-xs text-gray-400 mt-1">{product.descripcion}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">{product.stock}</span>
                        {product.stock <= product.stockMinimo && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Stock Bajo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Mín: {product.stockMinimo}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-600">Venta:</span> 
                          <span className="font-bold text-green-600">${product.precioVenta.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-600">Minorista:</span> 
                          <span className="font-bold text-blue-600">${product.precioMinorista.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-600">Mayorista:</span> 
                          <span className="font-bold text-purple-600">${product.precioMayorista.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge className="bg-blue-100 text-blue-700">
                        IVA 19% Obligatorio
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {product.codigoBarras}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowBarcodeView(product)}
                          className="p-1 hover:bg-gray-100"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowMovementForm(true)
                          }}
                          className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                          title="Movimiento de inventario"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                        {session?.user?.role === 'ADMIN' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(product)}
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProduct(product.id)}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-300">
                  <Bolt className="h-12 w-12 text-gray-500" />
                </div>
                <div className="text-gray-500 text-xl font-medium">No se encontraron productos de tornillería</div>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega el primer producto de tornillería para comenzar'}
                </p>
                {!searchTerm && session?.user?.role === 'ADMIN' && (
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="mt-4 bg-gray-700 hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Producto
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSuccess={fetchProducts}
        tipo="TORNILLERIA"
        categoria="TORNILLERIA"
      />

      <ProductForm
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={fetchProducts}
        product={editingProduct}
        tipo="TORNILLERIA"
        categoria="TORNILLERIA"
      />

      <MovementForm
        isOpen={showMovementForm}
        onClose={() => {
          setShowMovementForm(false)
          setSelectedProduct(null)
        }}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Barcode View Modal */}
      {showBarcodeView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Código de Barras</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowBarcodeView(null)}>
                ×
              </Button>
            </div>
            <div className="text-center">
              <h4 className="font-medium mb-4 text-gray-700">{showBarcodeView.nombre}</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <BarcodeDisplay value={showBarcodeView.codigoBarras} />
              </div>
              <p className="text-sm text-gray-500 mt-3">Código: {showBarcodeView.codigo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}