import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { LubricacionModal } from '@/components/forms/LubricacionModal'
import {
  Save,
  Trash2,
  Plus,
  Camera,
  Wrench,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scan
} from 'lucide-react'
import toast from 'react-hot-toast'

interface EditarOrdenModalProps {
  isOpen: boolean
  onClose: () => void
  ordenId: string
  onSuccess: () => void
}

interface Servicio {
  id?: string
  clave?: string
  descripcion: string
  precio: number
  aceiteId?: string
  filtroId?: string
  requiereLubricacion?: boolean
}

interface ProductoOrden {
  id: string
  productoId: string
  nombre: string
  codigo: string
  cantidad: number
  precio: number
  tipoPrecio: string
  subtotal: number
  stock?: number
}

interface RepuestoExterno {
  id: string
  nombre: string
  descripcion: string
  cantidad: number
  precioCompra: number
  precioVenta: number
  subtotal: number
  utilidad: number
  proveedor: string
}

export function EditarOrdenModal({ isOpen, onClose, ordenId, onSuccess }: EditarOrdenModalProps) {
  const [loading, setLoading] = useState(false)
  const [orden, setOrden] = useState<any>(null)
  const [estado, setEstado] = useState('')
  const [manoDeObra, setManoDeObra] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  
  // Servicios
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Servicio[]>([])
  const [showLubricacionModal, setShowLubricacionModal] = useState(false)
  const [servicioLubricacionTemp, setServicioLubricacionTemp] = useState<Servicio | null>(null)
  
  // Productos
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoOrden[]>([])
  const [showScanner, setShowScanner] = useState(false)
  
  // Repuestos Externos
  const [repuestosExternos, setRepuestosExternos] = useState<RepuestoExterno[]>([])
  const [showRepuestoModal, setShowRepuestoModal] = useState(false)

  useEffect(() => {
    if (isOpen && ordenId) {
      fetchOrden()
      fetchServicios()
    }
  }, [isOpen, ordenId])

  const fetchOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${ordenId}`)
      if (response.ok) {
        const data = await response.json()
        setOrden(data)
        setEstado(data.estado)
        setManoDeObra(data.manoDeObra || 0)
        setDescripcion(data.descripcion)
        
        // Cargar servicios
        setServiciosSeleccionados(data.servicios.map((s: any) => ({
          id: s.id,
          descripcion: s.descripcion,
          precio: s.precio,
          aceiteId: s.aceiteId,
          filtroId: s.filtroId
        })))
        
        // Cargar productos
        setProductosSeleccionados(data.detalles.map((d: any) => ({
          id: d.id,
          productoId: d.productoId,
          nombre: d.producto.nombre,
          codigo: d.producto.codigo,
          cantidad: d.cantidad,
          precio: d.precioUnitario,
          tipoPrecio: d.tipoPrecio,
          subtotal: d.subtotal,
          stock: d.producto.stock
        })))
        
        // Cargar repuestos externos
        setRepuestosExternos(data.repuestosExternos.map((r: any) => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion || '',
          cantidad: r.cantidad,
          precioCompra: r.precioCompra || 0,
          precioVenta: r.precioUnitario,
          subtotal: r.subtotal,
          utilidad: r.utilidad || 0,
          proveedor: r.proveedor || ''
        })))
      }
    } catch (error) {
      toast.error('Error al cargar la orden')
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios-taller')
      if (response.ok) {
        const data = await response.json()
        setServiciosDisponibles(data.map((s: any) => ({
          clave: s.clave,
          descripcion: s.descripcion,
          precio: parseFloat(s.valor),
          requiereLubricacion: s.clave === 'LUBRICACION'
        })))
      }
    } catch (error) {
      console.error('Error fetching servicios:', error)
    }
  }

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await fetch(`/api/productos/barcode/${encodeURIComponent(code)}`)
      
      if (response.ok) {
        const product = await response.json()
        
        const exists = productosSeleccionados.find(p => p.productoId === product.id)
        if (exists) {
          toast.error('Este producto ya está agregado')
          return
        }

        const nuevoProducto: ProductoOrden = {
          id: `new-${Date.now()}`,
          productoId: product.id,
          nombre: product.nombre,
          codigo: product.codigo,
          cantidad: 1,
          precio: product.precioVenta,
          tipoPrecio: 'VENTA',
          subtotal: product.precioVenta,
          stock: product.stock
        }

        setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
        toast.success(`Producto agregado: ${product.nombre}`)
      } else {
        toast.error('Producto no encontrado')
      }
    } catch (error) {
      toast.error('Error al buscar producto')
    }
    setShowScanner(false)
  }

  const agregarServicio = (servicio: Servicio) => {
    if (servicio.requiereLubricacion) {
      setServicioLubricacionTemp(servicio)
      setShowLubricacionModal(true)
    } else {
      const existe = serviciosSeleccionados.find(s => s.clave === servicio.clave)
      if (!existe) {
        setServiciosSeleccionados([...serviciosSeleccionados, { ...servicio, id: `new-${Date.now()}` }])
        toast.success('Servicio agregado')
      }
    }
  }

  const handleLubricacionAdded = (aceiteId: string, filtroId: string) => {
    if (servicioLubricacionTemp) {
      const servicioConLubricacion: Servicio = {
        ...servicioLubricacionTemp,
        id: `new-${Date.now()}`,
        aceiteId,
        filtroId
      }
      setServiciosSeleccionados([...serviciosSeleccionados, servicioConLubricacion])
      setServicioLubricacionTemp(null)
      toast.success('Servicio de lubricación agregado')
    }
  }

  const removerServicio = (index: number) => {
    setServiciosSeleccionados(serviciosSeleccionados.filter((_, i) => i !== index))
  }

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const nuevosProductos = [...productosSeleccionados]
    nuevosProductos[index] = { ...nuevosProductos[index], [campo]: valor }
    
    if (campo === 'cantidad' || campo === 'precio') {
      nuevosProductos[index].subtotal = nuevosProductos[index].cantidad * nuevosProductos[index].precio
    }
    
    setProductosSeleccionados(nuevosProductos)
  }

  const removerProducto = (index: number) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index))
  }

  const agregarRepuestoExterno = (repuesto: RepuestoExterno) => {
    setRepuestosExternos([...repuestosExternos, { ...repuesto, id: `new-${Date.now()}` }])
  }

  const removerRepuestoExterno = (index: number) => {
    setRepuestosExternos(repuestosExternos.filter((_, i) => i !== index))
  }

  const calcularTotales = () => {
    const totalServicios = serviciosSeleccionados.reduce((sum, s) => sum + s.precio, 0)
    const totalProductos = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)
    const totalRepuestosExternos = repuestosExternos.reduce((sum, r) => sum + r.subtotal, 0)
    const subtotal = totalServicios + totalProductos + totalRepuestosExternos + manoDeObra
    
    return { totalServicios, totalProductos, totalRepuestosExternos, subtotal }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const totales = calcularTotales()
      
      const response = await fetch(`/api/ordenes/${ordenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado,
          manoDeObra,
          descripcion,
          servicios: serviciosSeleccionados,
          productos: productosSeleccionados,
          repuestosExternos,
          total: totales.subtotal
        })
      })

      if (response.ok) {
        toast.success('Orden actualizada exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar orden')
      }
    } catch (error) {
      toast.error('Error al actualizar orden')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-blue-100 text-blue-800"><Wrench className="h-3 w-3 mr-1" />En Proceso</Badge>
      case 'COMPLETADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>
      default:
        return null
    }
  }

  if (!orden) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando..." size="xl">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    )
  }

  const totales = calcularTotales()

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Editar Orden ${orden.numeroOrden}`} size="xl">
        <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
          {/* Información General */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Actual</label>
                <div className="pt-2">{getEstadoBadge(estado)}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mano de Obra</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manoDeObra}
                  onChange={(e) => setManoDeObra(parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-green-600" />
                Servicios
              </h3>
            </div>

            {/* Servicios disponibles */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {serviciosDisponibles.map(servicio => (
                <div key={servicio.clave} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="text-sm font-medium">{servicio.descripcion}</span>
                    <span className="text-xs text-gray-500 ml-2">${servicio.precio.toLocaleString()}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => agregarServicio(servicio)}
                    disabled={serviciosSeleccionados.some(s => s.clave === servicio.clave)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Servicios seleccionados */}
            {serviciosSeleccionados.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Seleccionados:</h4>
                {serviciosSeleccionados.map((servicio, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex-1">
                      <span className="font-medium text-green-800">{servicio.descripcion}</span>
                      <span className="text-sm text-green-600 ml-2">${servicio.precio.toLocaleString()}</span>
                      {servicio.aceiteId && servicio.filtroId && (
                        <div className="text-xs text-green-600 mt-1">✓ Con lubricación</div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removerServicio(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Productos
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowScanner(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="h-4 w-4 mr-1" />
                Escanear
              </Button>
            </div>

            {productosSeleccionados.length > 0 ? (
              <div className="space-y-2">
                {productosSeleccionados.map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">{producto.codigo}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => actualizarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center"
                      />
                      <span className="text-green-600 font-medium">${producto.subtotal.toLocaleString()}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removerProducto(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay productos agregados</p>
            )}
          </div>

          {/* Repuestos Externos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-orange-600" />
                Repuestos Externos
              </h3>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowRepuestoModal(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {repuestosExternos.length > 0 ? (
              <div className="space-y-2">
                {repuestosExternos.map((repuesto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{repuesto.nombre}</div>
                      <div className="text-xs text-gray-500">Cantidad: {repuesto.cantidad}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-600 font-medium">${repuesto.subtotal.toLocaleString()}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removerRepuestoExterno(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay repuestos externos</p>
            )}
          </div>

          {/* Totales */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Servicios:</span>
                <span className="font-semibold">${totales.totalServicios.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Productos:</span>
                <span className="font-semibold">${totales.totalProductos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Repuestos Ext.:</span>
                <span className="font-semibold">${totales.totalRepuestosExternos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mano de Obra:</span>
                <span className="font-semibold">${manoDeObra.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-blue-200">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-2xl font-bold text-blue-600">${totales.subtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Alerta de cambio de estado */}
          {estado === 'COMPLETADO' && orden.estado !== 'COMPLETADO' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Registrar Ingreso en Contabilidad</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Al marcar esta orden como completada, se registrará automáticamente el ingreso en la contabilidad.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </Modal>

      {/* Modals adicionales */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Escanear Producto"
      />

      <LubricacionModal
        isOpen={showLubricacionModal}
        onClose={() => {
          setShowLubricacionModal(false)
          setServicioLubricacionTemp(null)
        }}
        onAdd={handleLubricacionAdded}
      />

      <RepuestoExternoModal
        isOpen={showRepuestoModal}
        onClose={() => setShowRepuestoModal(false)}
        onAdd={agregarRepuestoExterno}
      />
    </>
  )
}

// Modal de repuesto externo
function RepuestoExternoModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean
  onClose: () => void
  onAdd: (repuesto: RepuestoExterno) => void
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 1,
    precioCompra: 0,
    precioVenta: 0,
    proveedor: ''
  })

  const calcularUtilidad = () => {
    return (formData.cantidad * formData.precioVenta) - (formData.cantidad * formData.precioCompra)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || formData.precioVenta <= 0) {
      toast.error('Completa los campos requeridos')
      return
    }

    const repuesto: RepuestoExterno = {
      id: `new-${Date.now()}`,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      cantidad: formData.cantidad,
      precioCompra: formData.precioCompra,
      precioVenta: formData.precioVenta,
      subtotal: formData.cantidad * formData.precioVenta,
      utilidad: calcularUtilidad(),
      proveedor: formData.proveedor
    }

    onAdd(repuesto)
    setFormData({ nombre: '', descripcion: '', cantidad: 1, precioCompra: 0, precioVenta: 0, proveedor: '' })
    onClose()
    toast.success('Repuesto externo agregado')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Repuesto Externo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
          <Input
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <Input
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
          <Input
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <Input
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">P. Compra</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.precioCompra}
              onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">P. Venta *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.precioVenta}
              onChange={(e) => setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-sm">Utilidad:</span>
            <span className="font-bold text-green-600">${calcularUtilidad().toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
            Agregar Repuesto
          </Button>
        </div>
      </form>
    </Modal>
  )
}