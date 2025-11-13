"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Search,
  Eye,
  CircleCheck as CheckCircle,
  Clock,
  TriangleAlert as AlertTriangle,
  Car,
  User,
  Calendar,
  CalendarDays,
  Wrench,
  FileText,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Dropdown from "@/components/forms/Dropdown";

interface OrdenServicio {
  id: string;
  numeroOrden: string;
  descripcion: string;
  estado: "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "CANCELADO";
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  total: number;
  utilidad: number;
  cliente: { nombre: string; telefono?: string };
  vehiculo: { placa: string; marca: string; modelo: string; año?: number };
  mecanico: { name: string };
  servicios: any[];
  detalles: any[];
  repuestosExternos: any[];
}

/* ------------------------------------------------------------------ */
/* Animaciones                                                        */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Componente Principal                                               */
/* ------------------------------------------------------------------ */
export default function OrdenesPage() {
  const { data: session } = useSession();

  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("ALL");

  // Mes y Año actuales por defecto
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filterMes, setFilterMes] = useState(currentMonth.toString());
  const [filterAño, setFilterAño] = useState(currentYear.toString());

  const years = Array.from(
    { length: currentYear + 10 - 2025 + 1 },
    (_, i) => 2025 + i
  );

  const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER", "MECANICO"].includes(
    session?.user?.role ?? ""
  );
  const canCreate = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role ?? ""
  );

  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (hasAccess) fetchOrdenes();
  }, [hasAccess, filterMes, filterAño, filterEstado]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMes !== "ALL") params.append("mes", filterMes);
      if (filterAño !== "ALL") params.append("año", filterAño);
      if (filterEstado !== "ALL") params.append("estado", filterEstado);

      const res = await fetch(`/api/ordenes?${params.toString()}`);
      if (res.ok) {
        setOrdenes(await res.json());
      } else {
        toast.error("Error al cargar órdenes");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

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

  /* --------------------------------------------------------------- */
  const getEstadoBadge = (estado: string) => {
    const base = "flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full";
    switch (estado) {
      case "PENDIENTE":
        return (
          <Badge className={`${base} bg-yellow-100 text-yellow-800`}>
            <Clock className="h-3 w-3" /> Pendiente
          </Badge>
        );
      case "EN_PROCESO":
        return (
          <Badge className={`${base} bg-blue-100 text-blue-800`}>
            <Wrench className="h-3 w-3" /> En Proceso
          </Badge>
        );
      case "COMPLETADO":
        return (
          <Badge className={`${base} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3" /> Completado
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className={`${base} bg-red-100 text-red-800`}>
            <AlertTriangle className="h-3 w-3" /> Cancelado
          </Badge>
        );
      default:
        return <Badge className={base}>{estado}</Badge>;
    }
  };

  const filteredOrdenes = ordenes.filter(
    (o) =>
      o.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pendientes: ordenes.filter((o) => o.estado === "PENDIENTE").length,
    enProceso: ordenes.filter((o) => o.estado === "EN_PROCESO").length,
    completadas: ordenes.filter((o) => o.estado === "COMPLETADO").length,
  };

  /* --------------------------------------------------------------- */
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-xl text-white"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wrench className="h-8 w-8" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Órdenes de Trabajo
              </h1>
              <p className="text-indigo-100 text-sm mt-1">
                {filterMes !== "ALL" && filterAño !== "ALL"
                  ? `${filterMes}/${filterAño}`
                  : "Todos los períodos"}
              </p>
            </div>
          </div>
        </motion.div>
        {/* Filtros */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Orden, cliente, placa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mes
                  </label>
                  <Dropdown
                    options={[
                      { value: "ALL", label: "Todos" },
                      ...Array.from({ length: 12 }, (_, i) => ({
                        value: (i + 1).toString(),
                        label: new Date(2024, i)
                          .toLocaleString("es-CO", { month: "long" })
                          .replace(/^\w/, (c) => c.toUpperCase()),
                      })),
                    ]}
                    value={filterMes}
                    onChange={setFilterMes}
                    placeholder="Mes"
                    icon={<Calendar className="h-4 w-4 text-slate-500" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Año
                  </label>
                  <Dropdown
                    options={[
                      { value: "ALL", label: "Todos" },
                      ...years.map((y) => ({ value: y.toString(), label: y.toString() })),
                    ]}
                    value={filterAño}
                    onChange={setFilterAño}
                    placeholder="Año"
                    icon={<CalendarDays className="h-4 w-4 text-slate-500" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado
                  </label>
                  <Dropdown
                    options={[
                      { value: "ALL", label: "Todos" },
                      { value: "PENDIENTE", label: "Pendiente" },
                      { value: "EN_PROCESO", label: "En Proceso" },
                      { value: "COMPLETADO", label: "Completado" },
                      { value: "CANCELADO", label: "Cancelado" },
                    ]}
                    value={filterEstado}
                    onChange={setFilterEstado}
                    placeholder="Estado"
                    icon={<Filter className="h-4 w-4 text-slate-500" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: "Pendientes",
              value: stats.pendientes,
              icon: Clock,
              color: "from-yellow-500 to-yellow-600",
            },
            {
              title: "En Proceso",
              value: stats.enProceso,
              icon: Wrench,
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Completadas",
              value: stats.completadas,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card
                className={`bg-gradient-to-br ${s.color} text-white border-0 rounded-2xl shadow-lg`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {s.title}
                    </CardTitle>
                    <s.icon className="h-5 w-5 opacity-80" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Lista de Órdenes */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Órdenes ({filteredOrdenes.length})
                </CardTitle>
                {canCreate && (
                  <Link href="/ordenes/nueva">
                    <Button className="bg-white text-indigo-600 hover:bg-indigo-50 h-9">
                      <Plus className="h-4 w-4 mr-1" /> Nueva
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {/* Mobile View */}
                <div className="lg:hidden p-4 space-y-3">
                  {filteredOrdenes.map((orden, i) => (
                    <motion.div
                      key={orden.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white rounded-xl shadow-sm p-4 border"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-indigo-700">
                            {orden.numeroOrden}
                          </div>
                          <div className="text-sm text-gray-600">
                            {orden.descripcion}
                          </div>
                        </div>
                        {getEstadoBadge(orden.estado)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" /> {orden.cliente.nombre}
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5" />{" "}
                          {orden.vehiculo.marca} {orden.vehiculo.modelo} -{" "}
                          {orden.vehiculo.placa}
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3.5 w-3.5" /> {orden.mecanico.name}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            (window.location.href = `/ordenes/${orden.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop View */}
                <table className="hidden lg:table w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">
                        Orden
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">
                        Cliente
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">
                        Vehículo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">
                        Mecánico
                      </th>
                      <th className="text-center py-3 px-4 font-medium text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdenes.map((orden, i) => (
                      <motion.tr
                        key={orden.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b hover:bg-indigo-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-indigo-700">
                            {orden.numeroOrden}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(orden.fechaCreacion).toLocaleDateString(
                              "es-CO"
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{orden.cliente.nombre}</div>
                          {orden.cliente.telefono && (
                            <div className="text-xs text-slate-500">
                              {orden.cliente.telefono}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            {orden.vehiculo.marca} {orden.vehiculo.modelo}
                          </div>
                          <div className="text-xs text-slate-500">
                            {orden.vehiculo.placa}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getEstadoBadge(orden.estado)}
                        </td>
                        <td className="py-3 px-4">{orden.mecanico.name}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              (window.location.href = `/ordenes/${orden.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {/* Sin resultados */}
                {filteredOrdenes.length === 0 && (
                  <div className="text-center py-12">
                    <Wrench className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700">
                      No hay órdenes
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {searchTerm
                        ? "Prueba con otros filtros"
                        : "No hay órdenes en este período"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}