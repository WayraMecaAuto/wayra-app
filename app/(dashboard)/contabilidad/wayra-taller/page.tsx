"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Wrench,
  BarChart3,
  Download,
  Zap,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";
import toast from "react-hot-toast";

interface IngresoServicio {
  id: string;
  fecha: Date;
  descripcion: string;
  monto: number;
  tipo: "SERVICIO" | "REPUESTO_EXTERNO" | "MANO_OBRA";
  ordenId?: string;
}

interface ServicioMasRealizado {
  descripcion: string;
  cantidad: number;
  ingresoTotal: number;
}

interface EgresoContable {
  id: string;
  fecha: Date;
  descripcion: string;
  concepto: string;
  usuario: string;
  rol: string;
  valor: number;
}

const CONCEPTOS_EGRESO = [
  { value: "GASTO_OPERATIVO", label: "Gasto Operativo" },
  { value: "GASTO_NOMINA", label: "Nómina" },
  { value: "COMPRA_HERRAMIENTAS", label: "Compra de Herramientas" },
  { value: "SERVICIOS_PUBLICOS", label: "Servicios Públicos" },
  { value: "ARRIENDO", label: "Arriendo" },
  { value: "OTRO", label: "Otro" },
];

export default function ContabilidadWayraTallerPage() {
  const { data: session } = useSession();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [ingresos, setIngresos] = useState<IngresoServicio[]>([]);
  const [serviciosMasRealizados, setServiciosMasRealizados] = useState<
    ServicioMasRealizado[]
  >([]);
  const [egresos, setEgresos] = useState<EgresoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [searchIngresos, setSearchIngresos] = useState("");
  const [searchEgresos, setSearchEgresos] = useState("");
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = 2025; year <= currentYear + 10; year++) {
    years.push(year);
  }

  const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );

  useEffect(() => {
    if (hasAccess) {
      fetchContabilidad();
    }
  }, [hasAccess, mes, año]);

  const fetchContabilidad = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/contabilidad/wayra-taller?mes=${mes}&año=${año}`
      );
      if (response.ok) {
        const data = await response.json();
        setIngresos(data.ingresos || []);
        setServiciosMasRealizados(data.serviciosMasRealizados || []);
        setEgresos(data.egresos || []);
      } else {
        toast.error("Error al cargar contabilidad");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar contabilidad");
    } finally {
      setLoading(false);
    }
  };

  const eliminarEgreso = async (id: string) => {
    if (!confirm("¿Eliminar este egreso?")) return;

    try {
      const response = await fetch(`/api/contabilidad/wayra-taller?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Egreso eliminado");
        fetchContabilidad();
      } else {
        toast.error("Error al eliminar egreso");
      }
    } catch (error) {
      toast.error("Error al eliminar egreso");
    }
  };

  const calcularTotales = () => {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const totalEgresos = egresos.reduce((sum, e) => sum + e.valor, 0);
    const utilidad = totalIngresos - totalEgresos;
    return { totalIngresos, totalEgresos, utilidad };
  };

  const filteredIngresos = ingresos.filter((i) =>
    i.descripcion.toLowerCase().includes(searchIngresos.toLowerCase())
  );

  const filteredEgresos = egresos.filter(
    (e) =>
      e.descripcion.toLowerCase().includes(searchEgresos.toLowerCase()) ||
      e.concepto.toLowerCase().includes(searchEgresos.toLowerCase())
  );

  const totales = calcularTotales();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
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
            <h1 className="text-3xl font-bold mb-2">
              Contabilidad Wayra Taller
            </h1>
            <p className="text-indigo-100 text-lg">
              Reporte de servicios, ingresos y gastos operacionales
            </p>
          </div>
        </div>
      </div>

      {/* Selectores */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleString("es-CO", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos los años</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Ingresos Totales
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              ${totales.totalIngresos.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {ingresos.length} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Egresos Operacionales
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              ${totales.totalEgresos.toLocaleString()}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {egresos.length} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">
              Utilidad Neta
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${totales.utilidad >= 0 ? "text-indigo-800" : "text-red-800"}`}
            >
              ${totales.utilidad.toLocaleString()}
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              {totales.utilidad >= 0 ? "Ganancia" : "Pérdida"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Servicios más realizados */}
      {serviciosMasRealizados.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Servicios Más Realizados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-64 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Servicio
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Veces Realizado
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      Ingreso Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosMasRealizados.map((servicio, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {servicio.descripcion}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-blue-600">
                        {servicio.cantidad}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                        ${servicio.ingresoTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingresos */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="h-5 w-5" />
              <span>Ingresos por Servicios ({filteredIngresos.length})</span>
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchIngresos}
                onChange={(e) => setSearchIngresos(e.target.value)}
                className="pl-9 h-9 bg-white text-gray-900"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Descripción
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIngresos.length > 0 ? (
                  filteredIngresos.map((ingreso, index) => (
                    <tr
                      key={ingreso.id}
                      className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="py-3 px-4 text-sm">
                        {new Date(ingreso.fecha).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {ingreso.descripcion}
                      </td>
                      <td className="py-3 px-4">
                        {ingreso.tipo === "SERVICIO" && (
                          <Badge className="bg-blue-100 text-blue-700">
                            Servicio
                          </Badge>
                        )}
                        {ingreso.tipo === "REPUESTO_EXTERNO" && (
                          <Badge className="bg-orange-100 text-orange-700">
                            Repuesto Ext.
                          </Badge>
                        )}
                        {ingreso.tipo === "MANO_OBRA" && (
                          <Badge className="bg-purple-100 text-purple-700">
                            Mano de Obra
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                        ${ingreso.monto.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No hay ingresos registrados para este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Egresos */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Egresos ({filteredEgresos.length})</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchEgresos}
                onChange={(e) => setSearchEgresos(e.target.value)}
                className="pl-9 h-9 bg-white text-gray-900"
              />
            </div>
            <Button
              onClick={() => setShowEgresoModal(true)}
              size="sm"
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Descripción
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Concepto
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Valor
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEgresos.length > 0 ? (
                  filteredEgresos.map((egreso, index) => (
                    <tr
                      key={egreso.id}
                      className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="py-3 px-4 text-sm">
                        {new Date(egreso.fecha).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {egreso.descripcion}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="text-xs">{egreso.concepto}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        -${egreso.valor.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => eliminarEgreso(egreso.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No hay egresos para este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EgresoModal
        isOpen={showEgresoModal}
        onClose={() => setShowEgresoModal(false)}
        onSuccess={fetchContabilidad}
        entidad="WAYRA"
      />
    </div>
  );
}

function EgresoModal({
  isOpen,
  onClose,
  onSuccess,
  entidad,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entidad: string;
}) {
  const [formData, setFormData] = useState({
    descripcion: "",
    valor: "",
    concepto: "GASTO_OPERATIVO",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descripcion || !formData.valor) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/contabilidad/wayra-taller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Egreso registrado");
        setFormData({
          descripcion: "",
          valor: "",
          concepto: "GASTO_OPERATIVO",
        });
        onSuccess();
        onClose();
      } else {
        toast.error("Error al registrar egreso");
      }
    } catch (error) {
      toast.error("Error al registrar egreso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Egreso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <Input
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            placeholder="Ej: Pago nómina Juan, Compra herramientas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concepto *
          </label>
          <select
            value={formData.concepto}
            onChange={(e) =>
              setFormData({ ...formData, concepto: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {CONCEPTOS_EGRESO.map((concepto) => (
              <option key={concepto.value} value={concepto.value}>
                {concepto.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.valor}
            onChange={(e) =>
              setFormData({ ...formData, valor: e.target.value })
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Guardando..." : "Guardar Egreso"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
