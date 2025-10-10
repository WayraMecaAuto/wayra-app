'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, User, Car, Wrench, Package, DollarSign, FileText, Calendar, CreditCard as Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface OrdenDetalle {
  id: string
  numeroOrden: string
  descripcion: string
  estado: string
  fechaCreacion: string
  fechaInicio?: string
  fechaFin?: string
  manoDeObra: number
  subtotalServicios: number
  subtotalProductos: number
  subtotalRepuestosExternos: number
  total: number
  utilidad: number
  cliente: any
  vehiculo: any
  mecanico: any
  servicios: any[]
  detalles: any[]
  repuestosExternos: any[]
}

export default function OrdenDetallePage() {
  const { data: session } = useSession()
  const params = useParams()
  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrden()
    }
  }, [params.id])

  const fetchOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrden(data)
      } else {
        toast.error('Error al cargar orden')
      }
    } catch (error) {
      toast.error('Error al cargar orden')
    } finally {
      setLoading(false)
    }
  }

  const updateEstado = async (nuevoEstado: string) => {
    setUpdating(true)
    try {
      const updateData: any = { estado: nuevoEstado }
      
      if (nuevoEstado === 'EN_PROCESO' && !orden?.fechaInicio) {
        updateData.fechaInicio = new Date().toISOString()
      }
      
      if (nuevoEstado === 'COMPLETADO' && !orden?.fechaFin) {
        updateData.fechaFin = new Date().toISOString()
      }

      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success(`Orden marcada como ${nuevoEstado.toLowerCase()}`)
        fetchOrden()
      } else {
        toast.error('Error al actualizar estado')
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    } finally {
      setUpdating(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Wrench className="h-3 w-3 mr-1" />
          En Proceso
        </Badge>
      case 'COMPLETADO':
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      case 'CANCELADO':
        return <Badge className="bg-red-100 text-red-800 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Orden no encontrada</h2>
        <Link href="/ordenes">
          <Button>Volver a Órdenes</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/ordenes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{orden.numeroOrden}</h1>
            <p className="text-gray-600">Orden de trabajo</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getEstadoBadge(orden.estado)}
          <Link href={`/ordenes/${orden.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Estado Actions */}
      {orden.estado !== 'COMPLETADO' && orden.estado !== 'CANCELADO' && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              {orden.estado === 'PENDIENTE' && (
                <Button
                  onClick={() => updateEstado('EN_PROCESO')}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Iniciar Trabajo
                </Button>
              )}
              {orden.estado === 'EN_PROCESO' && (
                <Button
                  onClick={() => updateEstado('COMPLETADO')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar Completado
                </Button>
              )}
              <Button
                onClick={() => updateEstado('CANCELADO')}
                disabled={updating}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Cancelar Orden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Cliente y Vehículo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">{orden.cliente.nombre}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {orden.cliente.telefono && <div>📞 {orden.cliente.telefono}</div>}
                {orden.cliente.email && <div>📧 {orden.cliente.email}</div>}
                {orden.cliente.numeroDocumento && (
                  <div>{orden.cliente.tipoDocumento}: {orden.cliente.numeroDocumento}</div>
                )}
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>{orden.vehiculo.marca} {orden.vehiculo.modelo}</span>
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Placa: {orden.vehiculo.placa}</div>
                {orden.vehiculo.año && <div>Año: {orden.vehiculo.año}</div>}
                {orden.vehiculo.color && <div>Color: {orden.vehiculo.color}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Información de la Orden</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mecánico:</span>
                <div className="font-medium">{orden.mecanico.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Fecha Creación:</span>
                <div className="font-medium">
                  {new Date(orden.fechaCreacion).toLocaleDateString('es-CO')}
                </div>
              </div>
              {orden.fechaInicio && (
                <div>
                  <span className="text-gray-600">Fecha Inicio:</span>
                  <div className="font-medium">
                    {new Date(orden.fechaInicio).toLocaleDateString('es-CO')}
                  </div>
                </div>
              )}
              {orden.fechaFin && (
                <div>
                  <span className="text-gray-600">Fecha Fin:</span>
                  <div className="font-medium">
                    {new Date(orden.fechaFin).toLocaleDateString('es-CO')}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-700 mb-2">Descripción:</h5>
              <p className="text-gray-600">{orden.descripcion}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servicios */}
      {orden.servicios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-green-600" />
              <span>Servicios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orden.servicios.map((servicio: any) => (
                <div key={servicio.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">{servicio.descripcion}</span>
                  <span className="font-bold text-green-600">${servicio.precio.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Productos */}
      {orden.detalles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Productos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Producto</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Precio Unit.</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.detalles.map((detalle: any) => (
                    <tr key={detalle.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{detalle.producto.nombre}</div>
                          <div className="text-sm text-gray-500">{detalle.producto.codigo}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{detalle.cantidad}</td>
                      <td className="py-3 px-4 font-medium text-blue-600">
                        ${detalle.precioUnitario.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-600">
                        ${detalle.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repuestos Externos */}
      {orden.repuestosExternos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Repuestos Externos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Repuesto</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Proveedor</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Cantidad</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Precio Unit.</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orden.repuestosExternos.map((repuesto: any) => (
                    <tr key={repuesto.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{repuesto.nombre}</div>
                          {repuesto.descripcion && (
                            <div className="text-sm text-gray-500">{repuesto.descripcion}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{repuesto.proveedor}</td>
                      <td className="py-3 px-4 font-medium">{repuesto.cantidad}</td>
                      <td className="py-3 px-4 font-medium text-orange-600">
                        ${repuesto.precioUnitario.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-orange-600">
                        ${repuesto.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span>Resumen Financiero</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Servicios</div>
              <div className="text-xl font-bold text-green-600">
                ${orden.subtotalServicios.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Productos</div>
              <div className="text-xl font-bold text-blue-600">
                ${orden.subtotalProductos.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Repuestos Ext.</div>
              <div className="text-xl font-bold text-orange-600">
                ${orden.subtotalRepuestosExternos.toLocaleString()}
              </div>
            </div>
            {orden.manoDeObra > 0 && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Mano de Obra</div>
                <div className="text-xl font-bold text-purple-600">
                  ${orden.manoDeObra.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-purple-600">
                ${orden.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">Utilidad:</span>
              <span className="font-bold text-green-600">
                ${orden.utilidad.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}