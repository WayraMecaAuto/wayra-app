'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Package, 
  Download,
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Dropdown from '@/components/forms/Dropdown'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function ReportesWayraProductosPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('mensual')
  const [año, setAño] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [vistaActual, setVistaActual] = useState<'productos' | 'contabilidad' | 'comparativa'>('productos')

  // Estados para datos
  const [productosVendidos, setProductosVendidos] = useState<any>(null)
  const [contabilidad, setContabilidad] = useState<any>(null)
  const [comparativa, setComparativa] = useState<any>(null)

  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      cargarDatos()
    }
  }, [hasAccess, periodo, año, mes, vistaActual])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (vistaActual === 'productos') {
        const res = await fetch(`/api/reportes/wayra-productos?tipo=productos-vendidos`)
        if (res.ok) setProductosVendidos(await res.json())
      } else if (vistaActual === 'contabilidad') {
        const res = await fetch(`/api/reportes/wayra-productos?tipo=contabilidad&periodo=${periodo}&año=${año}&mes=${mes}`)
        if (res.ok) setContabilidad(await res.json())
      } else if (vistaActual === 'comparativa') {
        const res = await fetch(`/api/reportes/wayra-productos?tipo=comparativa&año=${año}&año2=${año - 1}`)
        if (res.ok) setComparativa(await res.json())
      }
    } catch (error) {
      toast.error('Error al cargar reportes')
    } finally {
      setLoading(false)
    }
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text('Reporte Wayra Productos', 14, 15)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 22)
    
    if (vistaActual === 'productos' && productosVendidos) {
      doc.text('Productos Más Vendidos', 14, 30)
      const tableData = productosVendidos.masVendidos.map((p: any) => [
        p.nombre,
        p.cantidad_vendida,
        `$${Number(p.total_vendido).toLocaleString()}`,
        `$${Number(p.utilidad_total).toLocaleString()}`
      ])
      ;(doc as any).autoTable({
        head: [['Producto', 'Cantidad', 'Ventas', 'Utilidad']],
        body: tableData,
        startY: 35
      })
    }

    doc.save(`reporte-wayra-productos-${vistaActual}-${new Date().getTime()}.pdf`)
    toast.success('PDF descargado')
  }

  if (!hasAccess) redirect('/dashboard')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Opciones para Dropdown
  const añosOptions = Array.from({ length: 11 }, (_, i) => ({
    value: 2025 + i,
    label: String(2025 + i)
  }))

  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('es-CO', { month: 'long' })
  }))

  const periodoOptions = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' }
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Reportes Wayra Productos</h1>
              <p className="text-blue-100 text-lg">Análisis de ventas y contabilidad</p>
            </div>
          </div>
          <Button onClick={exportarPDF} className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Navegación */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setVistaActual('productos')}
              variant={vistaActual === 'productos' ? 'default' : 'outline'}
              className={vistaActual === 'productos' ? 'bg-blue-600' : ''}
            >
              <Package className="h-4 w-4 mr-2" />
              Productos
            </Button>
            <Button
              onClick={() => setVistaActual('contabilidad')}
              variant={vistaActual === 'contabilidad' ? 'default' : 'outline'}
              className={vistaActual === 'contabilidad' ? 'bg-blue-600' : ''}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Contabilidad
            </Button>
            <Button
              onClick={() => setVistaActual('comparativa')}
              variant={vistaActual === 'comparativa' ? 'default' : 'outline'}
              className={vistaActual === 'comparativa' ? 'bg-blue-600' : ''}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Comparativa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      {vistaActual !== 'productos' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Año</label>
                <Dropdown
                  options={añosOptions}
                  value={año}
                  onChange={setAño}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
              {vistaActual === 'contabilidad' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Periodo</label>
                    <Dropdown
                      options={periodoOptions}
                      value={periodo}
                      onChange={setPeriodo}
                      icon={<Target className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mes</label>
                    <Dropdown
                      options={mesesOptions}
                      value={mes}
                      onChange={setMes}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISTA: PRODUCTOS */}
      {vistaActual === 'productos' && productosVendidos && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productos Más Vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top 10 Más Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bar
                  data={{
                    labels: productosVendidos.masVendidos.slice(0, 10).map((p: any) => p.nombre),
                    datasets: [{
                      label: 'Cantidad Vendida',
                      data: productosVendidos.masVendidos.slice(0, 10).map((p: any) => Number(p.cantidad_vendida)),
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Productos Más Vendidos (Todo el Tiempo)' }
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Productos Menos Vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Sin Ventas Registradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {productosVendidos.menosVendidos.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{p.nombre}</p>
                        <p className="text-sm text-gray-600">{p.tipo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock: {p.stock}</p>
                        <p className="text-sm font-medium">${p.precioVenta.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla Detallada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">Tipo</th>
                      <th className="text-right py-3 px-4">Cantidad</th>
                      <th className="text-right py-3 px-4">Total Vendido</th>
                      <th className="text-right py-3 px-4">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosVendidos.masVendidos.map((p: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4">{p.nombre}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {p.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{Number(p.cantidad_vendida)}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-bold">
                          ${Number(p.total_vendido).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 font-bold">
                          ${Number(p.utilidad_total).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* VISTA: CONTABILIDAD */}
      {vistaActual === 'contabilidad' && contabilidad && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  ${contabilidad.resumen.totalIngresos.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" />
                  Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-800">
                  ${contabilidad.resumen.totalEgresos.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-700">Utilidad Neta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">
                  ${contabilidad.resumen.utilidadNeta.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-purple-700">Margen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">
                  {contabilidad.resumen.margenUtilidad}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <Line
                data={{
                  labels: contabilidad.porMes.map((m: any) => m.mes),
                  datasets: [
                    {
                      label: 'Ingresos',
                      data: contabilidad.porMes.map((m: any) => m.ingresos),
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      tension: 0.4
                    },
                    {
                      label: 'Egresos',
                      data: contabilidad.porMes.map((m: any) => m.egresos),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4
                    },
                    {
                      label: 'Utilidad',
                      data: contabilidad.porMes.map((m: any) => m.utilidad),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  interaction: { mode: 'index', intersect: false },
                }}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* VISTA: COMPARATIVA */}
      {vistaActual === 'comparativa' && comparativa && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600">Ingresos</p>
                    <p className={`text-2xl font-bold ${parseFloat(comparativa.crecimiento.ingresos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparativa.crecimiento.ingresos}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilidad</p>
                    <p className={`text-2xl font-bold ${parseFloat(comparativa.crecimiento.utilidad) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparativa.crecimiento.utilidad}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{comparativa.año1.año}:</span>
                    <span className="font-bold">${comparativa.año1.totalIngresos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{comparativa.año2.año}:</span>
                    <span className="font-bold">${comparativa.año2.totalIngresos.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex justify-between text-blue-600">
                      <span>Diferencia:</span>
                      <span className="font-bold">
                        ${(comparativa.año1.totalIngresos - comparativa.año2.totalIngresos).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparación Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <Line
                data={{
                  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                  datasets: [
                    {
                      label: `${comparativa.año1.año}`,
                      data: comparativa.año1.porMes.map((m: any) => m.ingresos),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4
                    },
                    {
                      label: `${comparativa.año2.año}`,
                      data: comparativa.año2.porMes.map((m: any) => m.ingresos),
                      borderColor: 'rgb(156, 163, 175)',
                      backgroundColor: 'rgba(156, 163, 175, 0.1)',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  interaction: { mode: 'index', intersect: false },
                }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}