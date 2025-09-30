'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Calculator, DollarSign, TrendingUp, FileText, Calendar, 
  Download, PieChart, BarChart3, CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function WayraContabilidadPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)

  // Verificar permisos
  const hasAccess = ['SUPER_USUARIO', 'ADMIN_WAYRA_PRODUCTOS'].includes(session?.user?.role || '')

  useEffect(() => {
    if (hasAccess) {
      setLoading(false)
    }
  }, [hasAccess])

  if (!hasAccess) {
    redirect('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Image
                src="/images/WayraLogo.png"
                alt="Wayra Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Contabilidad Wayra</h1>
              <p className="text-blue-100 text-lg">Gestión financiera ENI + CALAN</p>
            </div>
          </div>
          <Button className="bg-white text-blue-800 hover:bg-blue-50 shadow-lg">
            <Download className="h-4 w-4 mr-2" />
            Exportar Contabilidad
          </Button>
        </div>
      </div>

      {/* Módulos de Contabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Estados Financieros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <Calculator className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Balance general y P&L</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <CreditCard className="h-5 w-5 text-green-600" />
              <span>Flujo de Caja</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-8">
              <CreditCard className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Próximamente</h3>
              <p className="text-gray-500">Ingresos y egresos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}