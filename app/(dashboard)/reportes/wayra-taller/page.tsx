'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Wrench, 
  Download,
  Calendar,
  DollarSign,
  Award
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
import { Bar, Line, Pie } from 'react-chartjs-2'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

export default function ReportesWayraTallerPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('mensual')
  const [año, setAño] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'servicios' | 'mecanicos' | 'contabilidad' | 'comparativa'>('dashboard')

  // Estados para datos
  const [serviciosFrecuencia, setServiciosFrecuencia] = useState<any>(null)
  const [mecanicoProductividad, setMecanicoProductividad] = useState<any>(null)
  const [contabilidad, setContabilidad] = useState<any>(null)
  const [comparativa, setComparativa] = useState<any>(null)

  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER', 'MECANICO'].includes(session?.user?.role || '')
  const canViewContabilidad = ['SUPER_USUARIO', 'ADMIN_WAYRA_TALLER'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      cargarDatos()
    }
  }, [hasAccess, periodo, año, mes, vistaActual])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (vistaActual === 'servicios') {
        const res = await fetch(`/api/reportes/wayra-taller?tipo=servicios-frecuencia`)
        if (res.ok) setServiciosFrecuencia(await res.json())
      } else if (vistaActual === 'mecanicos') {
        const res = await fetch(`/api/reportes/wayra-taller?tipo=mecanicos-productividad&año=${año}&mes=${mes}`)
        if (res.ok) setMecanicoProductividad(await res.json())
      } else if (vistaActual === 'contabilidad' && canViewContabilidad) {
        const res = await fetch(`/api/reportes/wayra-taller?tipo=contabilidad&periodo=${periodo}&año=${año}&mes=${mes}`)
        if (res.ok) setContabilidad(await res.json())
      } else if (vistaActual === 'comparativa' && canViewContabilidad) {
        const res = await fetch(`/api/reportes/wayra-taller?tipo=comparativa&año=${año}&año2=${año - 1}`)
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
    doc.text('Reporte Wayra Taller', 14, 15)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 22)
    
    if (vistaActual === 'servicios' && serviciosFrecuencia) {
      doc.text('Servicios Más Realizados', 14, 30)
      const tableData = serviciosFrecuencia.masRealizados.map((s: any) => [
        s.descripcion,
        s.veces_realizado,
        `$${s.ingreso_total.toLocaleString()}`
      ])
      ;(doc as any).autoTable({
        head: [['Servicio', 'Veces', 'Ingreso Total']],
        body: tableData,
        startY: 35
      })
    }

    doc.save(`reporte-taller-${vistaActual}-${new Date().getTime()}.pdf`)
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Reportes Wayra Taller</h1>
              <p className="text-indigo-100 text-lg">Análisis de servicios y productividad</p>
            </div>
          </div>
          <Button onClick={exportarPDF} className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg">
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
              onClick={() => setVistaActual('servicios')}
              variant={vistaActual === 'servicios' ? 'default' : 'outline'}
              className={vistaActual === 'servicios' ? 'bg-indigo-600' : ''}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Servicios
            </Button>
            <Button
              onClick={() => setVistaActual('mecanicos')}
              variant={vistaActual === 'mecanicos' ? 'default' : 'outline'}
              className={vistaActual === 'mecanicos' ? 'bg-indigo-600' : ''}
            >
              <Users className="h-4 w-4 mr-2" />
              Mecánicos
            </Button>
            {canViewContabilidad && (
              <>
                <Button
                  onClick={() => setVistaActual('contabilidad')}
                  variant={vistaActual === 'contabilidad' ? 'default' : 'outline'}
                  className={vistaActual === 'contabilidad' ? 'bg-indigo-600' : ''}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Contabilidad
                </Button>
                <Button
                  onClick={() => setVistaActual('comparativa')}
                  variant={vistaActual === 'comparativa' ? 'default' : 'outline'}
                  className={vistaActual === 'comparativa' ? 'bg-indigo-600' : ''}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Comparativa
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      {vistaActual !== 'servicios' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Año</label>
                <select
                  value={año}
                  onChange={(e) => setAño(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {vistaActual === 'contabilidad' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Periodo</label>
                    <select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleString('es-CO', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISTA: SERVICIOS */}
      {vistaActual === 'servicios' && serviciosFrecuencia && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Servicios Más Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: serviciosFrecuencia.masRealizados.slice(0, 10).map((s: any) => s.descripcion),
                  datasets: [{
                    label: 'Veces Realizado',
                    data: serviciosFrecuencia.masRealizados.slice(0, 10).map((s: any) => s.veces_realizado),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Top 10 Servicios' }
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Servicio</th>
                      <th className="text-right py-3 px-4">Veces</th>
                      <th className="text-right py-3 px-4">Ingreso Total</th>
                      <th className="text-right py-3 px-4">Precio Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviciosFrecuencia.masRealizados.map((s: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4">{s.descripcion}</td>
                        <td className="py-3 px-4 text-right font-bold">{s.veces_realizado}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-bold">
                          ${s.ingreso_total.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${s.precio_promedio.toLocaleString()}
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

      {/* VISTA: MECÁNICOS */}
      {vistaActual === 'mecanicos' && mecanicoProductividad && (
        <>
          {mecanicoProductividad.mecanicoDelMes && (
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-6 w-6 text-yellow-600" />
                  <span>Mecánico del Mes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-yellow-800">
                    {mecanicoProductividad.mecanicoDelMes.mecanico}
                  </h3>
                  <p className="text-yellow-600 mt-2">
                    {mecanicoProductividad.mecanicoDelMes.totalOrdenes} órdenes completadas
                  </p>
                  <p className="text-yellow-600">
                    ${mecanicoProductividad.mecanicoDelMes.totalIngresos.toLocaleString()} en ingresos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Productividad por Mecánico</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                data={{
                  labels: mecanicoProductividad.productividad.map((m: any) => m.mecanico),
                  datasets: [{
                    label: 'Órdenes Completadas',
                    data: mecanicoProductividad.productividad.map((m: any) => m.totalOrdenes),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                  }]
                }}
                options={{
                  responsive: true,
                  indexAxis: 'y',
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Mecánicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Mecánico</th>
                      <th className="text-right py-3 px-4">Órdenes</th>
                      <th className="text-right py-3 px-4">Ingresos</th>
                      <th className="text-right py-3 px-4">Tiempo Prom.</th>
                      <th className="text-right py-3 px-4">Ingreso/Orden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mecanicoProductividad.productividad.map((m: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-3 px-4 font-medium">{m.mecanico}</td>
                        <td className="py-3 px-4 text-right">{m.totalOrdenes}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-bold">
                          ${m.totalIngresos.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">{m.tiempoPromedioHoras}h</td>
                        <td className="py-3 px-4 text-right">
                          ${parseFloat(m.ingresoPromedioPorOrden).toLocaleString()}
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
      {vistaActual === 'contabilidad' && contabilidad && canViewContabilidad && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-green-700">Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">
                  ${contabilidad.resumen.totalIngresos.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100">
              <CardHeader>
                <CardTitle className="text-red-700">Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-800">
                  ${contabilidad.resumen.totalEgresos.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-700">Utilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">
                  ${contabilidad.resumen.utilidadNeta.toLocaleString()}
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Margen: {contabilidad.resumen.margenUtilidad}%
                </p>
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
                    },
                    {
                      label: 'Egresos',
                      data: contabilidad.porMes.map((m: any) => m.egresos),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
      {vistaActual === 'comparativa' && comparativa && canViewContabilidad && (
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
                    <p className="text-gray-600">Órdenes</p>
                    <p className={`text-2xl font-bold ${parseFloat(comparativa.crecimiento.ordenes) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparativa.crecimiento.ordenes}%
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
                      borderColor: 'rgb(99, 102, 241)',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                    {
                      label: `${comparativa.año2.año}`,
                      data: comparativa.año2.porMes.map((m: any) => m.ingresos),
                      borderColor: 'rgb(156, 163, 175)',
                      backgroundColor: 'rgba(156, 163, 175, 0.1)',
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