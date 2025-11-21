"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CalendarDays,
  Package,
  BarChart3,
  Download,
  Plus,
  Trash2,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Dropdown from "@/components/forms/Dropdown";

interface IngresoContable {
  id: string;
  fecha: Date;
  cantidad: number;
  descripcion: string;
  tipo: string;
  precioCompra: number;
  precioVenta: number;
  utilidad: number;
  ordenId?: string;
  productoId: string;
  motivo: string;
}

interface EgresoContable {
  id: string;
  fecha: Date;
  descripcion: string;
  concepto: string;
  usuario: string;
  valor: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

export default function ContabilidadWayraProductosPage() {
  const { data: session } = useSession();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [ingresos, setIngresos] = useState<IngresoContable[]>([]);
  const [egresos, setEgresos] = useState<EgresoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [searchIngresos, setSearchIngresos] = useState("");
  const [searchEgresos, setSearchEgresos] = useState("");
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 10 - 2025 + 1 }, (_, i) => 2025 + i);

  const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(session?.user?.role || "");

  useEffect(() => {
    if (hasAccess) fetchContabilidad();
  }, [hasAccess, mes, año]);

  const fetchContabilidad = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contabilidad/wayra-productos?mes=${mes}&año=${año}`);
      if (response.ok) {
        const data = await response.json();
        setIngresos(data.ingresos || []);
        setEgresos(data.egresos || []);
      } else toast.error("Error al cargar datos");
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const eliminarEgreso = async (id: string) => {
    if (!confirm("¿Eliminar este egreso?")) return;
    try {
      const response = await fetch(`/api/contabilidad/wayra-productos?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Egreso eliminado");
        fetchContabilidad();
      } else toast.error("Error al eliminar");
    } catch {
      toast.error("Error de red");
    }
  };

  const calcularTotales = () => {
    const totalIngresos = ingresos.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);
    const totalCostos = ingresos.reduce((sum, i) => sum + i.precioCompra * i.cantidad, 0);
    const totalEgresos = egresos.reduce((sum, e) => sum + e.valor, 0);
    const totalUtilidad = totalIngresos - totalCostos - totalEgresos;
    return { totalIngresos, totalCostos, totalEgresos, totalUtilidad };
  };

  const filteredIngresos = ingresos.filter(
    (i) =>
      i.descripcion.toLowerCase().includes(searchIngresos.toLowerCase()) ||
      i.motivo.toLowerCase().includes(searchIngresos.toLowerCase())
  );

  const filteredEgresos = egresos.filter(
    (e) =>
      e.descripcion.toLowerCase().includes(searchEgresos.toLowerCase()) ||
      e.concepto.toLowerCase().includes(searchEgresos.toLowerCase())
  );

  const totales = calcularTotales();

  if (!hasAccess) redirect("/dashboard");
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-xl text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Image src="/images/WayraLogo.png" alt="Wayra" width={38} height={38} className="object-contain" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contabilidad Productos Wayra</h1>
              <p className="text-indigo-100 text-sm mt-1">Ventas directas y desde órdenes</p>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                  <Dropdown
                    options={Array.from({ length: 12 }, (_, i) => ({
                      value: i + 1,
                      label: new Date(2024, i).toLocaleString("es-CO", { month: "long" }).replace(/^\w/, c => c.toUpperCase()),
                    }))}
                    value={mes}
                    onChange={setMes}
                    placeholder="Seleccionar mes"
                    icon={<Calendar className="h-4 w-4 text-slate-500" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                  <Dropdown
                    options={[
                      { value: "ALL", label: "Todos los años" },
                      ...years.map(y => ({ value: y, label: y.toString() }))
                    ]}
                    value={año}
                    onChange={(val) => setAño(val === "ALL" ? "ALL" : parseInt(val))}
                    placeholder="Seleccionar año"
                    icon={<CalendarDays className="h-4 w-4 text-slate-500" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Ingresos",
              value: totales.totalIngresos,
              icon: TrendingUp,
              bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
              text: "text-white",
              iconColor: "text-emerald-100",
            },
            {
              title: "Costos",
              value: totales.totalCostos,
              icon: TrendingDown,
              bg: "bg-gradient-to-br from-rose-500 to-rose-600",
              text: "text-white",
              iconColor: "text-rose-100",
            },
            {
              title: "Egresos",
              value: totales.totalEgresos,
              icon: DollarSign,
              bg: "bg-gradient-to-br from-amber-500 to-amber-600",
              text: "text-white",
              iconColor: "text-amber-100",
            },
            {
              title: "Utilidad",
              value: Math.abs(totales.totalUtilidad),
              icon: BarChart3,
              bg: totales.totalUtilidad >= 0 ? "bg-gradient-to-br from-indigo-500 to-indigo-600" : "bg-gradient-to-br from-red-500 to-red-600",
              text: "text-white",
              iconColor: totales.totalUtilidad >= 0 ? "text-indigo-100" : "text-red-100",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className={`${item.bg} text-white border-0 rounded-2xl shadow-lg overflow-hidden`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">
                    ${item.value.toLocaleString("es-CO")}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tablas */}
        {[
          {
            title: "Ventas de Productos",
            data: filteredIngresos,
            search: searchIngresos,
            setSearch: setSearchIngresos,
            empty: "No hay ventas para este período",
            icon: Package,
            renderRow: (item: IngresoContable, i: number) => {
              const tipoBadge = (
                <Badge
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    item.tipo === "WAYRA_ENI" ? "bg-blue-100 text-blue-800" : "bg-cyan-100 text-cyan-800"
                  }`}
                >
                  {item.tipo === "WAYRA_ENI" ? "ENI" : "CALAN"}
                </Badge>
              );

              return (
                <>
                  {/* Móvil: Tarjeta */}
                  <tr className="block sm:hidden border-b border-slate-100">
                    <td className="block p-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`p-4 space-y-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-xs text-slate-500">{new Date(item.fecha).toLocaleDateString("es-CO")}</p>
                            <p className="font-medium text-slate-900 mt-1 line-clamp-2">{item.descripcion}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.motivo}</p>
                          </div>
                          <span className="text-lg font-bold text-emerald-600 ml-3 whitespace-nowrap">
                            ${item.utilidad.toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          {tipoBadge}
                          <span className="text-sm">x {item.cantidad}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Compra: ${item.precioCompra.toLocaleString("es-CO")}</span>
                          <span>Venta: ${item.precioVenta.toLocaleString("es-CO")}</span>
                        </div>
                      </motion.div>
                    </td>
                  </tr>

                  {/* Desktop: Fila */}
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hidden sm:table-row border-b border-slate-100 hover:bg-emerald-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">
                      {new Date(item.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 max-w-xs truncate">
                      {item.descripcion}
                      <p className="text-xs text-slate-500">{item.motivo}</p>
                    </td>
                    <td className="py-3 px-4">{tipoBadge}</td>
                    <td className="py-3 px-4 text-right text-sm">{item.cantidad}</td>
                    <td className="py-3 px-4 text-right text-sm">${item.precioCompra.toLocaleString("es-CO")}</td>
                    <td className="py-3 px-4 text-right text-sm">${item.precioVenta.toLocaleString("es-CO")}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      ${(item.precioVenta * item.cantidad).toLocaleString("es-CO")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      ${item.utilidad.toLocaleString("es-CO")}
                    </td>
                  </motion.tr>
                </>
              );
            },
          },
          {
            title: "Egresos",
            data: filteredEgresos,
            search: searchEgresos,
            setSearch: setSearchEgresos,
            empty: "No hay egresos para este período",
            icon: TrendingDown,
            hasAdd: true,
            renderRow: (item: EgresoContable, i: number) => (
              <>
                {/* Móvil: Tarjeta */}
                <tr className="block sm:hidden border-b border-slate-100">
                  <td className="block p-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`p-4 space-y-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">{new Date(item.fecha).toLocaleDateString("es-CO")}</p>
                          <p className="font-medium text-slate-900 mt-1 line-clamp-2">{item.descripcion}</p>
                        </div>
                        <span className="text-lg font-bold text-rose-600 ml-3 whitespace-nowrap">
                          -${item.valor.toLocaleString("es-CO")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge className="text-xs bg-rose-100 text-rose-800">{item.concepto}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => eliminarEgreso(item.id)}
                          className="text-rose-600 hover:bg-rose-50 rounded-full p-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </td>
                </tr>

                {/* Desktop: Fila */}
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hidden sm:table-row border-b border-slate-100 hover:bg-rose-50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">
                    {new Date(item.fecha).toLocaleDateString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 max-w-xs truncate">{item.descripcion}</td>
                  <td className="py-3 px-4">
                    <Badge className="text-xs bg-rose-100 text-rose-800">{item.concepto}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                    -${item.valor.toLocaleString("es-CO")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarEgreso(item.id)}
                      className="text-rose-600 hover:bg-rose-50 rounded-full p-1.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </motion.tr>
              </>
            ),
          },
        ].map((table, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
              <CardHeader
                className={`bg-gradient-to-r ${table.hasAdd ? "from-rose-600 to-rose-700" : "from-emerald-600 to-emerald-700"} text-white p-4 sm:p-5`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <table.icon className="h-5 w-5" />
                    <span>{table.title} ({table.data.length})</span>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar..."
                        value={table.search}
                        onChange={(e) => table.setSearch(e.target.value)}
                        className="pl-10 h-9 w-full sm:w-64 bg-white text-slate-900 rounded-xl text-sm"
                      />
                    </div>
                    {table.hasAdd && (
                      <Button
                        onClick={() => setShowEgresoModal(true)}
                        size="sm"
                        className="bg-white text-rose-600 hover:bg-rose-50 font-medium h-9"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Agregar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0 z-10 hidden sm:table-header-group">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Descripción</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">{table.hasAdd ? "Concepto" : "Tipo"}</th>
                        {table.hasAdd ? null : (
                          <>
                            <th className="text-right py-3 px-4 font-medium text-slate-700">Cantidad</th>
                            <th className="text-right py-3 px-4 font-medium text-slate-700">Precio Compra</th>
                            <th className="text-right py-3 px-4 font-medium text-slate-700">Precio Venta</th>
                            <th className="text-right py-3 px-4 font-medium text-slate-700">Total</th>
                          </>
                        )}
                        <th className="text-right py-3 px-4 font-medium text-slate-700">{table.hasAdd ? "Valor" : "Utilidad"}</th>
                        {table.hasAdd && <th className="text-center py-3 px-4 font-medium text-slate-700">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {table.data.length > 0 ? (
                        table.data.map(table.renderRow)
                      ) : (
                        <tr>
                          <td colSpan={table.hasAdd ? 5 : 8} className="py-12 text-center text-slate-500 text-sm block sm:table-cell">
                            {table.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <EgresoModal isOpen={showEgresoModal} onClose={() => setShowEgresoModal(false)} onSuccess={fetchContabilidad} />
      </div>
    </motion.div>
  );
}

// Modal
function EgresoModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ descripcion: "", valor: "", concepto: "GASTO_OPERATIVO" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.valor) return toast.error("Completa todos los campos");
    setLoading(true);
    try {
      const res = await fetch(`/api/contabilidad/wayra-productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Egreso registrado");
        setFormData({ descripcion: "", valor: "", concepto: "GASTO_OPERATIVO" });
        onSuccess();
        onClose();
      } else toast.error("Error al guardar");
    } catch { toast.error("Error de red"); } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Egreso">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descripción *</label>
          <Input value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej: Compra de inventario" required className="rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Concepto *</label>
          <Dropdown
            options={[
              { value: "GASTO_OPERATIVO", label: "Gasto Operativo" },
              { value: "COMPRA_PRODUCTO", label: "Compra de Producto" },
              { value: "OTRO", label: "Otro" }
            ]}
            value={formData.concepto}
            onChange={(val) => setFormData({ ...formData, concepto: val })}
            placeholder="Seleccionar concepto"
            icon={<Tag className="h-4 w-4 text-slate-500" />}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Valor *</label>
          <Input type="number" step="0.01" min="0" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} placeholder="0.00" required className="rounded-xl" />
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">Cancelar</Button>
          <Button type="submit" disabled={loading} className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </motion.form>
    </Modal>
  );
}