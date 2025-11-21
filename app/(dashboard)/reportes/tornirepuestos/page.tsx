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
  ArrowDownRight,
  Percent
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
import { Bar, Line } from 'react-chartjs-2'
import toast from 'react-hot-toast'
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

export default function ReportesTorniRepuestosPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [vistaActual, setVistaActual] = useState<'productos' | 'contabilidad' | 'comparativa'>('productos')
  
  // Filtros para productos
  const [filtroProductos, setFiltroProductos] = useState<'todo' | 'mes'>('todo')
  const [mesProductos, setMesProductos] = useState(new Date().getMonth() + 1)
  const [añoProductos, setAñoProductos] = useState(new Date().getFullYear())
  
  // Filtros para contabilidad
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('mensual')
  const [año, setAño] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [trimestre, setTrimestre] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [semestre, setSemestre] = useState(new Date().getMonth() < 6 ? 1 : 2)
  
  // Para comparativa
  const [añoComparar, setAñoComparar] = useState(new Date().getFullYear() - 1)

  // Estados para datos
  const [productosVendidos, setProductosVendidos] = useState<any>(null)
  const [contabilidad, setContabilidad] = useState<any>(null)
  const [comparativa, setComparativa] = useState<any>(null)

  const hasAccess = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS', 'VENDEDOR_TORNI'].includes(session?.user?.role || '')
  const isAdmin = ['SUPER_USUARIO', 'ADMIN_TORNI_REPUESTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      cargarDatos()
    }
  }, [hasAccess, vistaActual, periodo, año, mes, trimestre, semestre, añoComparar, filtroProductos, mesProductos, añoProductos])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (vistaActual === 'productos') {
        let url = `/api/reportes/tornirepuestos?tipo=productos-vendidos`
        if (filtroProductos === 'mes') {
          url += `&mes=${mesProductos}&año=${añoProductos}`
        }
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setProductosVendidos(data)
        }
      } else if (vistaActual === 'contabilidad' && isAdmin) {
        let url = `/api/reportes/tornirepuestos?tipo=contabilidad&periodo=${periodo}&año=${año}`
        
        if (periodo === 'mensual') {
          url += `&mes=${mes}`
        } else if (periodo === 'trimestral') {
          url += `&trimestre=${trimestre}`
        } else if (periodo === 'semestral') {
          url += `&semestre=${semestre}`
        }
        
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setContabilidad(data)
        }
      } else if (vistaActual === 'comparativa' && isAdmin) {
        const res = await fetch(`/api/reportes/tornirepuestos?tipo=comparativa&año=${año}&año2=${añoComparar}`)
        if (res.ok) {
          const data = await res.json()
          setComparativa(data)
        }
      }
    } catch (error) {
      toast.error('Error al cargar reportes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!hasAccess) redirect('/dashboard')

  const añosOptions = Array.from({ length: 11 }, (_, i) => ({
    value: 2025 + i,
    label: String(2025 + i)
  }))

  const mesesOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('es-CO', { month: 'long' })
  }))

  const trimestreOptions = [
    { value: 1, label: 'Trimestre 1 (Ene-Mar)' },
    { value: 2, label: 'Trimestre 2 (Abr-Jun)' },
    { value: 3, label: 'Trimestre 3 (Jul-Sep)' },
    { value: 4, label: 'Trimestre 4 (Oct-Dic)' }
  ]

  const semestreOptions = [
    { value: 1, label: 'Semestre 1 (Ene-Jun)' },
    { value: 2, label: 'Semestre 2 (Jul-Dic)' }
  ]

  const periodoOptions = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' }
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Reportes TorniRepuestos</h1>
              <p className="text-orange-100 text-lg">Análisis de ventas y contabilidad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setVistaActual('productos')}
              variant={vistaActual === 'productos' ? 'default' : 'outline'}
              className={vistaActual === 'productos' ? 'bg-orange-600' : ''}
            >
              <Package className="h-4 w-4 mr-2" />
              Productos
            </Button>
            {isAdmin && (
              <>
                <Button
                  onClick={() => setVistaActual('contabilidad')}
                  variant={vistaActual === 'contabilidad' ? 'default' : 'outline'}
                  className={vistaActual === 'contabilidad' ? 'bg-orange-600' : ''}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Contabilidad
                </Button>
                <Button
                  onClick={() => setVistaActual('comparativa')}
                  variant={vistaActual === 'comparativa' ? 'default' : 'outline'}
                  className={vistaActual === 'comparativa' ? 'bg-orange-600' : ''}
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
      {vistaActual === 'productos' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Periodo</label>
                <Dropdown
                  options={[
                    { value: 'todo', label: 'Todo el tiempo' },
                    { value: 'mes', label: 'Por mes' }
                  ]}
                  value={filtroProductos}
                  onChange={(val) => setFiltroProductos(val as 'todo' | 'mes')}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
              {filtroProductos === 'mes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Año</label>
                    <Dropdown
                      options={añosOptions}
                      value={añoProductos}
                      onChange={setAñoProductos}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mes</label>
                    <Dropdown
                      options={mesesOptions}
                      value={mesProductos}
                      onChange={setMesProductos}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {vistaActual !== 'productos' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                  {periodo === 'mensual' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Mes</label>
                      <Dropdown
                        options={mesesOptions}
                        value={mes}
                        onChange={setMes}
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>
                  )}

                  {periodo === 'trimestral' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Trimestre</label>
                      <Dropdown
                        options={trimestreOptions}
                        value={trimestre}
                        onChange={setTrimestre}
                        icon={<Target className="h-4 w-4" />}
                      />
                    </div>
                  )}

                  {periodo === 'semestral' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Semestre</label>
                      <Dropdown
                        options={semestreOptions}
                        value={semestre}
                        onChange={setSemestre}
                        icon={<Target className="h-4 w-4" />}
                      />
                    </div>
                  )}
                </>
              )}

              {vistaActual === 'comparativa' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Comparar con</label>
                  <Dropdown
                    options={añosOptions}
                    value={añoComparar}
                    onChange={setAñoComparar}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          {/* VISTA: PRODUCTOS */}
          {vistaActual === 'productos' && productosVendidos && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos Más Vendidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Top 10 Más Vendidos {filtroProductos === 'mes' && `(${mesesOptions.find(m => m.value === mesProductos)?.label} ${añoProductos})`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Bar
                      data={{
                        labels: productosVendidos.masVendidos.slice(0, 10).map((p: any) => 
                          p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre
                        ),
                        datasets: [{
                          label: 'Cantidad Vendida',
                          data: productosVendidos.masVendidos.slice(0, 10).map((p: any) => Number(p.cantidad_vendida)),
                          backgroundColor: 'rgba(251, 146, 60, 0.8)',
                        }]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          title: { display: true, text: 'Productos Más Vendidos' }
                        }
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Productos Sin Ventas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Sin Ventas Registradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {productosVendidos.menosVendidos.length > 0 ? (
                        productosVendidos.menosVendidos.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{p.nombre}</p>
                              <p className="text-sm text-gray-600">{p.categoria}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Stock: {p.stock}</p>
                              {isAdmin && (
                                <p className="text-sm font-medium">${p.precioVenta.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-8">Todos los productos tienen ventas registradas</p>
                      )}
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
                          <th className="text-left py-3 px-4">Categoría</th>
                          <th className="text-right py-3 px-4">Cantidad</th>
                          {isAdmin && (
                            <>
                              <th className="text-right py-3 px-4">Total Vendido</th>
                              <th className="text-right py-3 px-4">Utilidad</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {productosVendidos.masVendidos.map((p: any, i: number) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{p.nombre}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                {p.categoria}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold">{Number(p.cantidad_vendida)}</td>
                            {isAdmin && (
                              <>
                                <td className="py-3 px-4 text-right text-green-600 font-bold">
                                  ${Number(p.total_vendido).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right text-blue-600 font-bold">
                                  ${Number(p.utilidad_total).toLocaleString()}
                                </td>
                              </>
                            )}
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
          {vistaActual === 'contabilidad' && contabilidad && isAdmin && (
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

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardHeader>
                    <CardTitle className="text-amber-700 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5" />
                      Costos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-800">
                      ${contabilidad.resumen.totalCostos.toLocaleString()}
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
                    <CardTitle className="text-blue-700 flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Utilidad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-800">
                      ${contabilidad.resumen.totalUtilidad.toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-600 mt-1">{contabilidad.resumen.margenUtilidad}% margen</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Evolución {periodo === 'mensual' ? 'Diaria' : periodo === 'anual' ? 'Mensual' : 'del Periodo'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    {contabilidad.porPeriodo && contabilidad.porPeriodo.length > 0 ? (
                      <Line
                        data={{
                          labels: contabilidad.porPeriodo.map((m: any) => m.periodo),
                          datasets: [
                            {
                              label: 'Ingresos',
                              data: contabilidad.porPeriodo.map((m: any) => m.ingresos),
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Costos',
                              data: contabilidad.porPeriodo.map((m: any) => m.costos),
                              borderColor: 'rgb(251, 191, 36)',
                              backgroundColor: 'rgba(251, 191, 36, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Egresos',
                              data: contabilidad.porPeriodo.map((m: any) => m.egresos),
                              borderColor: 'rgb(239, 68, 68)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Utilidad',
                              data: contabilidad.porPeriodo.map((m: any) => m.utilidad),
                              borderColor: 'rgb(59, 130, 246)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              tension: 0.4
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No hay datos para mostrar en este periodo
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* VISTA: COMPARATIVA */}
          {vistaActual === 'comparativa' && comparativa && isAdmin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Crecimiento Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${parseFloat(comparativa.crecimiento.ingresos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(comparativa.crecimiento.ingresos) >= 0 ? '+' : ''}{comparativa.crecimiento.ingresos}%
                      </p>
                      <p className="text-sm text-gray-600 mt-2">vs año anterior</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>{comparativa.año1.año}:</span>
                          <span className="font-bold">${comparativa.año1.totalIngresos.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{comparativa.año2.año}:</span>
                          <span className="font-bold">${comparativa.año2.totalIngresos.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Crecimiento Utilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${parseFloat(comparativa.crecimiento.utilidad) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(comparativa.crecimiento.utilidad) >= 0 ? '+' : ''}{comparativa.crecimiento.utilidad}%
                      </p>
                      <p className="text-sm text-gray-600 mt-2">vs año anterior</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>{comparativa.año1.año}:</span>
                          <span className="font-bold">${comparativa.año1.utilidadTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{comparativa.año2.año}:</span>
                          <span className="font-bold">${comparativa.año2.utilidadTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Diferencia Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        ${(comparativa.año1.totalIngresos - comparativa.año2.totalIngresos).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Diferencia en ingresos</p>
                      <div className="mt-4">
                        <p className="text-xl font-bold text-green-600">
                          ${(comparativa.año1.utilidadTotal - comparativa.año2.utilidadTotal).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Diferencia en utilidad</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Comparación Mensual de Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <Line
                      data={{
                        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                        datasets: [
                          {
                            label: `${comparativa.año1.año}`,
                            data: comparativa.año1.porMes.map((m: any) => m.ingresos),
                            borderColor: 'rgb(251, 146, 60)',
                            backgroundColor: 'rgba(251, 146, 60, 0.1)',
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
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparación Mensual de Utilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <Line
                        data={{
                          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                          datasets: [
                            {
                              label: `${comparativa.año1.año}`,
                              data: comparativa.año1.porMes.map((m: any) => m.utilidad),
                              borderColor: 'rgb(34, 197, 94)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: `${comparativa.año2.año}`,
                              data: comparativa.año2.porMes.map((m: any) => m.utilidad),
                              borderColor: 'rgb(156, 163, 175)',
                              backgroundColor: 'rgba(156, 163, 175, 0.1)',
                              tension: 0.4
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">{comparativa.año1.año} - Ingresos</p>
                        <p className="text-2xl font-bold text-orange-700">
                          ${comparativa.año1.totalIngresos.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{comparativa.año2.año} - Ingresos</p>
                        <p className="text-2xl font-bold text-gray-700">
                          ${comparativa.año2.totalIngresos.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">{comparativa.año1.año} - Utilidad</p>
                        <p className="text-2xl font-bold text-green-700">
                          ${comparativa.año1.utilidadTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{comparativa.año2.año} - Utilidad</p>
                        <p className="text-2xl font-bold text-gray-700">
                          ${comparativa.año2.utilidadTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}