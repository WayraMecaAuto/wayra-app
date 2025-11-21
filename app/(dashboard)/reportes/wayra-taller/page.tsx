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
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import toast from 'react-hot-toast'
import Dropdown from '@/components/forms/Dropdown'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

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

export default function ReportesWayraTaller() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [vistaActual, setVistaActual] = useState('general')
  const [filtroServicios, setFiltroServicios] = useState<'todo' | 'mes'>('todo')
  const [mesServicios, setMesServicios] = useState(new Date().getMonth() + 1)
  const [añoServicios, setAñoServicios] = useState(new Date().getFullYear())
  
  // Filtros
  const [periodo, setPeriodo] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('mensual')
  const [año, setAño] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [trimestre, setTrimestre] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [semestre, setSemestre] = useState(new Date().getMonth() < 6 ? 1 : 2)
  const [añoComparacion, setAñoComparacion] = useState(new Date().getFullYear() - 1)

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
  }, [hasAccess, vistaActual, periodo, año, mes, trimestre, semestre, añoComparacion, filtroServicios, mesServicios, añoServicios])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      if (vistaActual === 'general' || vistaActual === 'servicios') {
        let url = `/api/reportes/wayra-taller?tipo=servicios-frecuencia`
        if (filtroServicios === 'mes') {
          url += `&mes=${mesServicios}&año=${añoServicios}`
        }
        const res = await fetch(url)
        if (res.ok) setServiciosFrecuencia(await res.json())
      }

      if (vistaActual === 'general' || vistaActual === 'mecanicos') {
        let url = `/api/reportes/wayra-taller?tipo=mecanicos-productividad&año=${año}&periodo=${periodo}`
        
        if (periodo === 'mensual') {
          url += `&mes=${mes}`
        } else if (periodo === 'trimestral') {
          url += `&trimestre=${trimestre}`
        } else if (periodo === 'semestral') {
          url += `&semestre=${semestre}`
        }
        
        const res = await fetch(url)
        if (res.ok) setMecanicoProductividad(await res.json())
      }

      if ((vistaActual === 'general' || vistaActual === 'contabilidad') && canViewContabilidad) {
        let url = `/api/reportes/wayra-taller?tipo=contabilidad&periodo=${periodo}&año=${año}`
        
        if (periodo === 'mensual') {
          url += `&mes=${mes}`
        } else if (periodo === 'trimestral') {
          url += `&trimestre=${trimestre}`
        } else if (periodo === 'semestral') {
          url += `&semestre=${semestre}`
        }
        
        const res = await fetch(url)
        if (res.ok) setContabilidad(await res.json())
      }

      if (vistaActual === 'comparativa' && canViewContabilidad) {
        const res = await fetch(`/api/reportes/wayra-taller?tipo=comparativa&año=${año}&año2=${añoComparacion}`)
        if (res.ok) setComparativa(await res.json())
      }
    } catch (error) {
      toast.error('Error al cargar reportes')
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 sm:h-10 sm:w-10" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Reportes Wayra Taller</h1>
                <p className="text-indigo-100 text-sm sm:text-base lg:text-lg">Análisis y estadísticas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              {['general', 'servicios', 'mecanicos', canViewContabilidad && 'contabilidad', canViewContabilidad && 'comparativa']
                .filter(Boolean)
                .map((vista) => (
                  <Button
                    key={vista}
                    onClick={() => setVistaActual(vista as string)}
                    variant={vistaActual === vista ? 'default' : 'outline'}
                    className={`text-sm ${vistaActual === vista ? 'bg-indigo-600' : ''}`}
                    size="sm"
                  >
                    {vista === 'general' && <BarChart3 className="h-4 w-4 mr-2" />}
                    {vista === 'servicios' && <Wrench className="h-4 w-4 mr-2" />}
                    {vista === 'mecanicos' && <Users className="h-4 w-4 mr-2" />}
                    {vista === 'contabilidad' && <DollarSign className="h-4 w-4 mr-2" />}
                    {vista === 'comparativa' && <TrendingUp className="h-4 w-4 mr-2" />}
                    {vista?.charAt(0).toUpperCase() + vista?.slice(1)}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        {vistaActual !== 'general' && vistaActual !== 'servicios' && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Año</label>
                  <Dropdown
                    options={añosOptions}
                    value={año}
                    onChange={setAño}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>

                {(vistaActual === 'mecanicos' || vistaActual === 'contabilidad') && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Periodo</label>
                      <Dropdown
                        options={periodoOptions}
                        value={periodo}
                        onChange={setPeriodo}
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>

                    {periodo === 'mensual' && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">Mes</label>
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
                        <label className="block text-xs sm:text-sm font-medium mb-2">Trimestre</label>
                        <Dropdown
                          options={trimestreOptions}
                          value={trimestre}
                          onChange={setTrimestre}
                          icon={<Calendar className="h-4 w-4" />}
                        />
                      </div>
                    )}

                    {periodo === 'semestral' && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium mb-2">Semestre</label>
                        <Dropdown
                          options={semestreOptions}
                          value={semestre}
                          onChange={setSemestre}
                          icon={<Calendar className="h-4 w-4" />}
                        />
                      </div>
                    )}
                  </>
                )}

                {vistaActual === 'comparativa' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-2">Comparar con</label>
                    <Dropdown
                      options={añosOptions}
                      value={añoComparacion}
                      onChange={setAñoComparacion}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* VISTA GENERAL */}
            {vistaActual === 'general' && (
              <div className="space-y-4 sm:space-y-6">
                {canViewContabilidad && contabilidad && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base text-green-700 flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          Ingresos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800">
                          ${contabilidad.resumen.totalIngresos.toLocaleString()}
                        </div>
                        <p className="text-xs sm:text-sm text-green-600 mt-1">
                          {contabilidad.resumen.totalOrdenes} órdenes
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base text-red-700 flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4" />
                          Egresos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-800">
                          ${contabilidad.resumen.totalEgresos.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base text-blue-700">Utilidad</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800">
                          ${contabilidad.resumen.utilidadNeta.toLocaleString()}
                        </div>
                        <p className="text-xs sm:text-sm text-blue-600 mt-1 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {contabilidad.resumen.margenUtilidad}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm sm:text-base text-purple-700 flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Servicios
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-800">
                          {serviciosFrecuencia?.masRealizados.reduce((sum: number, s: any) => sum + s.veces_realizado, 0) || 0}
                        </div>
                        <p className="text-xs sm:text-sm text-purple-600 mt-1">Total realizados</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {serviciosFrecuencia && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Top 5 Servicios</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 sm:h-80">
                          <Bar
                            data={{
                              labels: serviciosFrecuencia.masRealizados.slice(0, 5).map((s: any) => 
                                s.descripcion.length > 20 ? s.descripcion.substring(0, 20) + '...' : s.descripcion
                              ),
                              datasets: [{
                                label: 'Veces',
                                data: serviciosFrecuencia.masRealizados.slice(0, 5).map((s: any) => s.veces_realizado),
                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              indexAxis: 'y',
                              plugins: { legend: { display: false } }
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {mecanicoProductividad?.mecanicoDelMes && (
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                          Mecánico del Mes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <h3 className="text-xl sm:text-2xl font-bold text-yellow-800">
                            {mecanicoProductividad.mecanicoDelMes.mecanico}
                          </h3>
                          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-yellow-600">Órdenes</p>
                              <p className="text-lg sm:text-xl font-bold text-yellow-800">
                                {mecanicoProductividad.mecanicoDelMes.totalOrdenes}
                              </p>
                            </div>
                            {canViewContabilidad && (
                              <div>
                                <p className="text-xs sm:text-sm text-yellow-600">Ingresos</p>
                                <p className="text-lg sm:text-xl font-bold text-yellow-800">
                                  ${(mecanicoProductividad.mecanicoDelMes.totalIngresos / 1000).toFixed(0)}k
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs sm:text-sm text-yellow-600">Tiempo</p>
                              <p className="text-lg sm:text-xl font-bold text-yellow-800">
                                {mecanicoProductividad.mecanicoDelMes.tiempoPromedioHoras}h
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* VISTA SERVICIOS */}
            {vistaActual === 'servicios' && serviciosFrecuencia && (
              <div className="space-y-4 sm:space-y-6">
                {/* Filtros de Servicios */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Periodo</label>
                        <Dropdown
                          options={[
                            { value: 'todo', label: 'Todo el tiempo' },
                            { value: 'mes', label: 'Por mes' }
                          ]}
                          value={filtroServicios}
                          onChange={(val) => setFiltroServicios(val as 'todo' | 'mes')}
                          icon={<Calendar className="h-4 w-4" />}
                        />
                      </div>
                      {filtroServicios === 'mes' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-2">Año</label>
                            <Dropdown
                              options={añosOptions}
                              value={añoServicios}
                              onChange={setAñoServicios}
                              icon={<Calendar className="h-4 w-4" />}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mes</label>
                            <Dropdown
                              options={mesesOptions}
                              value={mesServicios}
                              onChange={setMesServicios}
                              icon={<Calendar className="h-4 w-4" />}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Más Realizados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 sm:h-80">
                        <Bar
                          data={{
                            labels: serviciosFrecuencia.masRealizados.slice(0, 8).map((s: any) => 
                              s.descripcion.length > 15 ? s.descripcion.substring(0, 15) + '...' : s.descripcion
                            ),
                            datasets: [{
                              label: 'Cantidad',
                              data: serviciosFrecuencia.masRealizados.slice(0, 8).map((s: any) => s.veces_realizado),
                              backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {canViewContabilidad && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Ingresos por Servicio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 sm:h-80">
                          <Doughnut
                            data={{
                              labels: serviciosFrecuencia.masRealizados.slice(0, 5).map((s: any) => s.descripcion),
                              datasets: [{
                                data: serviciosFrecuencia.masRealizados.slice(0, 5).map((s: any) => s.ingreso_total),
                                backgroundColor: [
                                  'rgba(99, 102, 241, 0.8)',
                                  'rgba(34, 197, 94, 0.8)',
                                  'rgba(251, 191, 36, 0.8)',
                                  'rgba(239, 68, 68, 0.8)',
                                  'rgba(168, 85, 247, 0.8)'
                                ]
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: { boxWidth: 12, font: { size: 10 } }
                                }
                              }
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Detalle de Servicios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-2 sm:py-3 sm:px-4">Servicio</th>
                            <th className="text-right py-2 px-2 sm:py-3 sm:px-4">Veces</th>
                            {canViewContabilidad && (
                              <>
                                <th className="text-right py-2 px-2 sm:py-3 sm:px-4 hidden sm:table-cell">Ingreso</th>
                                <th className="text-right py-2 px-2 sm:py-3 sm:px-4">Promedio</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {serviciosFrecuencia.masRealizados.map((s: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="py-2 px-2 sm:py-3 sm:px-4">{s.descripcion}</td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right font-bold">{s.veces_realizado}</td>
                              {canViewContabilidad && (
                                <>
                                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-right text-green-600 font-bold hidden sm:table-cell">
                                    ${s.ingreso_total.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">
                                    ${s.precio_promedio.toLocaleString()}
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
              </div>
            )}

            {/* VISTA MECÁNICOS */}
            {vistaActual === 'mecanicos' && mecanicoProductividad && (
              <div className="space-y-4 sm:space-y-6">
                {mecanicoProductividad.mecanicoDelMes && (
                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                        Mecánico del Periodo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <h3 className="text-xl sm:text-2xl font-bold text-yellow-800">
                          {mecanicoProductividad.mecanicoDelMes.mecanico}
                        </h3>
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-yellow-600">Órdenes</p>
                            <p className="text-lg sm:text-2xl font-bold text-yellow-800">
                              {mecanicoProductividad.mecanicoDelMes.totalOrdenes}
                            </p>
                          </div>
                          {canViewContabilidad && (
                            <div>
                              <p className="text-xs sm:text-sm text-yellow-600">Ingresos</p>
                              <p className="text-lg sm:text-2xl font-bold text-yellow-800">
                                ${mecanicoProductividad.mecanicoDelMes.totalIngresos.toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs sm:text-sm text-yellow-600">Tiempo Prom.</p>
                            <p className="text-lg sm:text-2xl font-bold text-yellow-800">
                              {mecanicoProductividad.mecanicoDelMes.tiempoPromedioHoras}h
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Productividad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-96">
                      <Bar
                        data={{
                          labels: mecanicoProductividad.productividad.map((m: any) => m.mecanico),
                          datasets: [{
                            label: 'Órdenes',
                            data: mecanicoProductividad.productividad.map((m: any) => m.totalOrdenes),
                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                          }]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: 'y',
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Detalle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-2 sm:py-3 sm:px-4">Mecánico</th>
                            <th className="text-right py-2 px-2 sm:py-3 sm:px-4">Órdenes</th>
                            {canViewContabilidad && (
                              <>
                                <th className="text-right py-2 px-2 sm:py-3 sm:px-4 hidden lg:table-cell">Ingresos</th>
                                <th className="text-right py-2 px-2 sm:py-3 sm:px-4">$/Orden</th>
                              </>
                            )}
                            <th className="text-right py-2 px-2 sm:py-3 sm:px-4">Tiempo Prom.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mecanicoProductividad.productividad.map((m: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="py-2 px-2 sm:py-3 sm:px-4 font-medium">{m.mecanico}</td>
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">{m.totalOrdenes}</td>
                              {canViewContabilidad && (
                                <>
                                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-right text-green-600 font-bold hidden lg:table-cell">
                                    ${m.totalIngresos.toLocaleString()}
                                  </td>
                                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">
                                    ${parseFloat(m.ingresoPromedioPorOrden).toLocaleString()}
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-2 sm:py-3 sm:px-4 text-right">{m.tiempoPromedioHoras}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* VISTA CONTABILIDAD */}
            {vistaActual === 'contabilidad' && contabilidad && canViewContabilidad && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm text-green-700 flex items-center gap-2">
                        <ArrowUpRight className="h-4 w-4" />
                        Ingresos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-800">
                        ${contabilidad.resumen.totalIngresos.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm text-red-700 flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4" />
                        Egresos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-800">
                        ${contabilidad.resumen.totalEgresos.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm text-blue-700">Utilidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-800">
                        ${contabilidad.resumen.utilidadNeta.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm text-purple-700 flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Margen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-800">
                        {contabilidad.resumen.margenUtilidad}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Evolución {periodo === 'mensual' ? 'Mensual' : periodo === 'trimestral' ? 'Trimestral' : periodo === 'semestral' ? 'Semestral' : 'Anual'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-96">
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
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Órdenes por Periodo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: contabilidad.porPeriodo.map((m: any) => m.periodo),
                            datasets: [{
                              label: 'Órdenes',
                              data: contabilidad.porPeriodo.map((m: any) => m.ordenes),
                              backgroundColor: 'rgba(99, 102, 241, 0.8)',
                            }]
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
                      <CardTitle className="text-base sm:text-lg">Resumen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-700">Total Ingresos</span>
                          <span className="text-sm font-bold text-green-700">
                            ${contabilidad.resumen.totalIngresos.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                          <span className="text-sm text-gray-700">Total Egresos</span>
                          <span className="text-sm font-bold text-red-700">
                            ${contabilidad.resumen.totalEgresos.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-700">Utilidad Neta</span>
                          <span className="text-sm font-bold text-blue-700">
                            ${contabilidad.resumen.utilidadNeta.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm text-gray-700">Margen</span>
                          <span className="text-sm font-bold text-purple-700">
                            {contabilidad.resumen.margenUtilidad}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">Órdenes</span>
                          <span className="text-sm font-bold text-gray-700">
                            {contabilidad.resumen.totalOrdenes}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* VISTA COMPARATIVA */}
            {vistaActual === 'comparativa' && comparativa && canViewContabilidad && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Crecimiento Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className={`text-3xl sm:text-4xl font-bold ${parseFloat(comparativa.crecimiento.ingresos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(comparativa.crecimiento.ingresos) >= 0 ? '+' : ''}{comparativa.crecimiento.ingresos}%
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">vs año anterior</p>
                        <div className="mt-4 space-y-2 text-xs sm:text-sm">
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
                      <CardTitle className="text-base sm:text-lg">Crecimiento Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className={`text-3xl sm:text-4xl font-bold ${parseFloat(comparativa.crecimiento.ordenes) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {parseFloat(comparativa.crecimiento.ordenes) >= 0 ? '+' : ''}{comparativa.crecimiento.ordenes}%
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">vs año anterior</p>
                        <div className="mt-4 space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span>{comparativa.año1.año}:</span>
                            <span className="font-bold">{comparativa.año1.totalOrdenes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{comparativa.año2.año}:</span>
                            <span className="font-bold">{comparativa.año2.totalOrdenes}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Utilidad Comparativa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          ${comparativa.año1.utilidadTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">{comparativa.año1.año}</p>
                        <div className="my-3 border-t"></div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-600">
                          ${comparativa.año2.utilidadTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">{comparativa.año2.año}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Comparación Mensual de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-96">
                      <Line
                        data={{
                          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                          datasets: [
                            {
                              label: `${comparativa.año1.año}`,
                              data: comparativa.año1.porMes.map((m: any) => m.ingresos),
                              borderColor: 'rgb(99, 102, 241)',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Utilidad Mensual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
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
                      <CardTitle className="text-base sm:text-lg">Órdenes Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                            datasets: [
                              {
                                label: `${comparativa.año1.año}`,
                                data: comparativa.año1.porMes.map((m: any) => m.ordenes),
                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                              },
                              {
                                label: `${comparativa.año2.año}`,
                                data: comparativa.año2.porMes.map((m: any) => m.ordenes),
                                backgroundColor: 'rgba(156, 163, 175, 0.8)',
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
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}