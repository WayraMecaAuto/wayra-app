'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Plus, Search, Trash2, Car, User, Calendar, DollarSign, Wrench, FileText, Package, Calculator, Save, Camera, Scan, ShoppingCart, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { Modal } from '@/components/ui/modal'
import { ClienteForm } from '@/components/forms/ClienteForm'
import { VehiculoForm } from '@/components/forms/VehiculoForm'
import { LubricacionModal } from '@/components/forms/LubricacionModal'
import toast from 'react-hot-toast'

interface OrdenForm {
  clienteId: string
  vehiculoId: string
  descripcion: string
  mecanicoId: string
  manoDeObra: string
}

interface Servicio {
  clave: string
  descripcion: string
  precio: number
  requiereLubricacion?: boolean
}

interface ProductoOrden {
  id: string
  nombre: string
  codigo: string
  cantidad: number
  precio: number
  tipoPrecio: 'VENTA' | 'MINORISTA' | 'MAYORISTA'
  subtotal: number
  stock: number
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

interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
}

interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  año?: number
  clienteId: string
}

interface ServicioConLubricacion extends Servicio {
  aceiteId?: string
  filtroId?: string
  aceiteNombre?: string
  filtroNombre?: string
}

export default function NuevaOrdenPage() {
  const { data: session } = useSession()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [mecanicos, setMecanicos] = useState<any[]>([])
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioConLubricacion[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoOrden[]>([])
  const [repuestosExternos, setRepuestosExternos] = useState<RepuestoExterno[]>([])
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [showVehiculoModal, setShowVehiculoModal] = useState(false)
  const [showRepuestoModal, setShowRepuestoModal] = useState(false)
  const [showLubricacionModal, setShowLubricacionModal] = useState(false)
  const [servicioLubricacionTemp, setServicioLubricacionTemp] = useState<Servicio | null>(null)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<OrdenForm>({
    defaultValues: {
      manoDeObra: '0'
    }
  })
  const selectedClienteId = watch('clienteId')
  const manoDeObra = parseFloat(watch('manoDeObra') || '0')

  useEffect(() => {
    if (hasAccess) {
      fetchClientes()
      fetchMecanicos()
      fetchServicios()
    }
  }, [hasAccess])

  useEffect(() => {
    if (selectedClienteId) {
      fetchVehiculos(selectedClienteId)
    } else {
      setVehiculos([])
      setValue('vehiculoId', '')
    }
  }, [selectedClienteId])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Error fetching clientes:', error)
    }
  }

  const fetchVehiculos = async (clienteId: string) => {
    try {
      const response = await fetch(`/api/vehiculos?clienteId=${clienteId}`)
      if (response.ok) {
        const data = await response.json()
        setVehiculos(data)
      }
    } catch (error) {
      console.error('Error fetching vehiculos:', error)
    }
  }

  const fetchMecanicos = async () => {
    try {
      const response = await fetch('/api/mecanicos')
      if (response.ok) {
        const data = await response.json()
        setMecanicos(data)
      }
    } catch (error) {
      console.error('Error fetching mecánicos:', error)
    }
  }

  const fetchServicios = async () => {
    try {
      const response = await fetch('/api/servicios-taller')
      if (response.ok) {
        const data = await response.json()
        const servicios = data.map((s: any) => ({
          clave: s.clave,
          descripcion: s.descripcion,
          precio: parseFloat(s.valor),
          requiereLubricacion: s.clave === 'SERVICIO_LUBRICACION' // Identificar servicio de lubricación
        }))
        setServiciosDisponibles(servicios)
      }
    } catch (error) {
      console.error('Error fetching servicios:', error)
    }
  }

  const handleClienteCreated = (cliente: Cliente) => {
    setClientes([...clientes, cliente])
    setValue('clienteId', cliente.id)
  }

  const handleVehiculoCreated = (vehiculo: Vehiculo) => {
    setVehiculos([...vehiculos, vehiculo])
    setValue('vehiculoId', vehiculo.id)
  }

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await fetch(`/api/productos/barcode/${encodeURIComponent(code)}`)
      
      if (response.ok) {
        const product = await response.json()
        
        const exists = productosSeleccionados.find(p => p.id === product.id)
        if (exists) {
          toast.error('Este producto ya está agregado a la orden')
          return
        }

        const nuevoProducto: ProductoOrden = {
          id: product.id,
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
      // Si es servicio de lubricación, abrir modal para seleccionar aceite y filtro
      setServicioLubricacionTemp(servicio)
      setShowLubricacionModal(true)
    } else {
      const existe = serviciosSeleccionados.find(s => s.clave === servicio.clave)
      if (!existe) {
        setServiciosSeleccionados([...serviciosSeleccionados, servicio])
        toast.success('Servicio agregado')
      }
    }
  }

  const handleLubricacionAdded = async (aceiteId: string, filtroId: string) => {
    if (servicioLubricacionTemp) {
      try {
        // Obtener información completa de aceite y filtro
        const [aceiteResponse, filtroResponse] = await Promise.all([
          fetch(`/api/productos/${aceiteId}`),
          fetch(`/api/productos/${filtroId}`)
        ])

        if (aceiteResponse.ok && filtroResponse.ok) {
          const aceite = await aceiteResponse.json()
          const filtro = await filtroResponse.json()
          
          // Calcular precio total del servicio de lubricación
          const precioTotal = aceite.precioVenta + filtro.precioVenta

          const servicioConLubricacion: ServicioConLubricacion = {
            ...servicioLubricacionTemp,
            precio: precioTotal, // Actualizar con el precio calculado
            aceiteId,
            filtroId,
            aceiteNombre: aceite.nombre,
            filtroNombre: filtro.nombre
          }
          
          setServiciosSeleccionados([...serviciosSeleccionados, servicioConLubricacion])
          setServicioLubricacionTemp(null)
          
          toast.success(
            <div>
              <div className="font-semibold">Servicio de lubricación agregado</div>
              <div className="text-sm mt-1">
                <div>• {aceite.nombre}</div>
                <div>• {filtro.nombre}</div>
                <div className="font-semibold mt-1">Total: ${precioTotal.toLocaleString()}</div>
              </div>
            </div>,
            { duration: 4000 }
          )
        } else {
          toast.error('Error al obtener los precios de los productos')
        }
      } catch (error) {
        console.error('Error calculating lubrication price:', error)
        toast.error('Error al calcular el precio del servicio')
      }
    }
  }

  const removerServicio = (servicioId: string) => {
    setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.clave !== servicioId))
    toast.success('Servicio removido')
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
    setRepuestosExternos([...repuestosExternos, { ...repuesto, id: Date.now().toString() }])
  }

  const removerRepuestoExterno = (index: number) => {
    setRepuestosExternos(repuestosExternos.filter((_, i) => i !== index))
  }

  const calcularTotales = () => {
    const totalServicios = serviciosSeleccionados.reduce((sum, s) => sum + s.precio, 0)
    const totalProductos = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)
    const totalRepuestosExternos = repuestosExternos.reduce((sum, r) => sum + r.subtotal, 0)
    const subtotal = totalServicios + totalProductos + totalRepuestosExternos + manoDeObra
    const total = subtotal
    const utilidadRepuestos = repuestosExternos.reduce((sum, r) => sum + r.utilidad, 0)

    return {
      totalServicios,
      totalProductos,
      totalRepuestosExternos,
      manoDeObra,
      subtotal,
      total,
      utilidadRepuestos
    }
  }

  const onSubmit = async (data: OrdenForm) => {
    if (serviciosSeleccionados.length === 0 && productosSeleccionados.length === 0 && repuestosExternos.length === 0) {
      toast.error('Debe agregar al menos un servicio, producto o repuesto externo')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          manoDeObra: parseFloat(data.manoDeObra) || 0,
          servicios: serviciosSeleccionados,
          productos: productosSeleccionados,
          repuestosExternos
        })
      })

      if (response.ok) {
        toast.success('Orden creada exitosamente')
        window.location.href = '/ordenes'
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear orden')
      }
    } catch (error) {
      toast.error('Error al crear orden')
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) {
    redirect('/ordenes')
  }

  const totales = calcularTotales()

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="h-6 sm:h-10 w-6 sm:w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Nueva Orden de Trabajo</h1>
            <p className="text-green-100 text-base sm:text-lg">Crear nueva orden de servicio completa</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del Cliente y Vehículo */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Cliente y Vehículo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex space-x-2">
                <select
                  {...register('clienteId', { required: 'Selecciona un cliente' })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.telefono && `- ${cliente.telefono}`}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClienteModal(true)}
                  title="Agregar nuevo cliente"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.clienteId && (
                <p className="text-sm text-red-600">{errors.clienteId.message}</p>
              )}

              <div className="flex space-x-2">
                <select
                  {...register('vehiculoId', { required: 'Selecciona un vehículo' })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedClienteId}
                >
                  <option value="">Seleccionar vehículo</option>
                  {vehiculos.map(vehiculo => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!selectedClienteId) {
                      toast.error('Primero selecciona un cliente');
                      return;
                    }
                    setShowVehiculoModal(true);
                  }}
                  disabled={!selectedClienteId}
                  title="Agregar nuevo vehículo"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.vehiculoId && (
                <p className="text-sm text-red-600">{errors.vehiculoId.message}</p>
              )}

              <div>
                <select
                  {...register('mecanicoId', { required: 'Selecciona un mecánico' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar mecánico</option>
                  {mecanicos.map(mecanico => (
                    <option key={mecanico.id} value={mecanico.id}>
                      {mecanico.name}
                    </option>
                  ))}
                </select>
                {errors.mecanicoId && (
                  <p className="text-sm text-red-600">{errors.mecanicoId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mano de Obra (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    {...register('manoDeObra')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <textarea
                  {...register('descripcion', { required: 'La descripción es requerida' })}
                  rows={3}
                  placeholder="Describe el trabajo a realizar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors.descripcion && (
                  <p className="text-sm text-red-600">{errors.descripcion.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span>Servicios del Taller</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {serviciosDisponibles.map(servicio => (
                  <div key={servicio.clave} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900">{servicio.descripcion}</div>
                      {!servicio.requiereLubricacion && (
                        <div className="text-sm text-gray-500">${servicio.precio.toLocaleString()}</div>
                      )}
                      {servicio.requiereLubricacion && (
                        <div className="text-xs text-blue-600 mt-1">
                          Precio según productos seleccionados
                        </div>
                      )}
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

              {/* Servicios Seleccionados */}
              {serviciosSeleccionados.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Servicios Seleccionados:</h4>
                  <div className="space-y-2">
                    {serviciosSeleccionados.map(servicio => (
                      <div key={servicio.clave} className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-green-800">{servicio.descripcion}</span>
                            <span className="text-sm font-bold text-green-700">${servicio.precio.toLocaleString()}</span>
                          </div>
                          {servicio.aceiteId && servicio.filtroId && (
                            <div className="text-xs text-green-600 space-y-0.5 mt-2">
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>Aceite: {servicio.aceiteNombre}</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>Filtro: {servicio.filtroNombre}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerServicio(servicio.clave)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productos del Inventario */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Productos del Inventario</span>
              </div>
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Camera className="h-4 w-4 mr-2" />
                Escanear Producto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {productosSeleccionados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Producto</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Stock</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Cantidad</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Tipo Precio</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Precio Unit.</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Subtotal</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosSeleccionados.map((producto, index) => (
                      <tr key={producto.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{producto.nombre}</div>
                            <div className="text-sm text-gray-500">{producto.codigo}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${producto.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                            {producto.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min="1"
                            max={producto.stock}
                            value={producto.cantidad}
                            onChange={(e) => actualizarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                            className="w-20 h-8 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={producto.tipoPrecio}
                            onChange={(e) => {
                              const tipoPrecio = e.target.value as 'VENTA' | 'MINORISTA' | 'MAYORISTA'
                              actualizarProducto(index, 'tipoPrecio', tipoPrecio)
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="VENTA">Venta</option>
                            <option value="MINORISTA">Minorista</option>
                            <option value="MAYORISTA">Mayorista</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-green-600">
                            ${producto.precio.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-green-600">
                            ${producto.subtotal.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removerProducto(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay productos agregados</p>
                <p className="text-sm">Escanea códigos de barras para agregar productos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repuestos Externos */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Repuestos Externos</span>
              </div>
              <Button
                type="button"
                onClick={() => setShowRepuestoModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Repuesto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {repuestosExternos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Repuesto</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Proveedor</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Cantidad</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">P. Compra</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">P. Venta</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Utilidad</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Subtotal</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repuestosExternos.map((repuesto, index) => (
                      <tr key={repuesto.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{repuesto.nombre}</div>
                            {repuesto.descripcion && (
                              <div className="text-sm text-gray-500">{repuesto.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{repuesto.proveedor || '-'}</td>
                        <td className="py-3 px-4 font-medium">{repuesto.cantidad}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          ${repuesto.precioCompra.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-orange-600">
                          ${repuesto.precioVenta.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          ${repuesto.utilidad.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-orange-600">
                          ${repuesto.subtotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removerRepuestoExterno(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay repuestos externos agregados</p>
                <p className="text-sm">Agrega repuestos que no están en el inventario</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen y Total */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-gray-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Resumen de la Orden</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Servicios</div>
                <div className="text-2xl font-bold text-green-600">
                  ${totales.totalServicios.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Productos</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totales.totalProductos.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Repuestos Ext.</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${totales.totalRepuestosExternos.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Mano de Obra</div>
                <div className="text-2xl font-bold text-indigo-600">
                  ${totales.manoDeObra.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-3xl font-bold text-purple-600">
                  ${totales.total.toLocaleString()}
                </div>
              </div>
            </div>
            
            {totales.utilidadRepuestos > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Utilidad Repuestos Externos:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${totales.utilidadRepuestos.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={loading}
            className="px-8 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-8 py-3 shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Creando...' : 'Crear Orden'}
          </Button>
        </div>
      </form>

      {/* Modals */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Escanear Producto para Orden"
      />

      <ClienteForm
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSuccess={handleClienteCreated}
      />

      {selectedClienteId && (
        <VehiculoForm
          isOpen={showVehiculoModal}
          onClose={() => setShowVehiculoModal(false)}
          onSuccess={handleVehiculoCreated}
          clienteId={selectedClienteId}
        />
      )}

      <RepuestoExternoModal
        isOpen={showRepuestoModal}
        onClose={() => setShowRepuestoModal(false)}
        onAdd={agregarRepuestoExterno}
      />

      <LubricacionModal
        isOpen={showLubricacionModal}
        onClose={() => {
          setShowLubricacionModal(false)
          setServicioLubricacionTemp(null)
        }}
        onAdd={handleLubricacionAdded}
      />
    </div>
  )
}

// Componente para modal de repuesto externo
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
    const totalCompra = formData.cantidad * formData.precioCompra
    const totalVenta = formData.cantidad * formData.precioVenta
    return totalVenta - totalCompra
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || formData.precioCompra <= 0 || formData.precioVenta <= 0) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (formData.precioVenta < formData.precioCompra) {
      toast.error('El precio de venta debe ser mayor al precio de compra')
      return
    }

    const utilidad = calcularUtilidad()

    const repuesto: RepuestoExterno = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      cantidad: formData.cantidad,
      precioCompra: formData.precioCompra,
      precioVenta: formData.precioVenta,
      subtotal: formData.cantidad * formData.precioVenta,
      utilidad: utilidad,
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Repuesto *
          </label>
          <Input
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Pastillas de freno Toyota"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <Input
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción adicional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor
          </label>
          <Input
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            placeholder="Nombre del proveedor"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Compra *
            </label>
            <Input
              type="number"
              step="100"
              min="0"
              value={formData.precioCompra}
              onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Venta *
            </label>
            <Input
              type="number"
              step="100"
              min="0"
              value={formData.precioVenta}
              onChange={(e) => setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Compra:</span>
            <span className="font-medium text-gray-800">
              ${(formData.cantidad * formData.precioCompra).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Venta:</span>
            <span className="font-medium text-orange-600">
              ${(formData.cantidad * formData.precioVenta).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="font-medium text-gray-700">Utilidad:</span>
            <span className="text-xl font-bold text-green-600">
              ${calcularUtilidad().toLocaleString()}
            </span>
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