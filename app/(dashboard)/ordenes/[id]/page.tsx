"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  User,
  Car,
  Wrench,
  Package,
  DollarSign,
  FileText,
  Calendar,
  CreditCard as Edit,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCheckbox as Checkbox } from "@/components/ui/animated-checkbox";
import { LubricacionModal } from "@/components/forms/LubricacionModal";
import { ProductSelectorModal } from "@/components/forms/ProductSelectorModal";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import toast from "react-hot-toast";

interface OrdenDetalle {
  id: string;
  numeroOrden: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  fechaInicio?: string;
  fechaFin?: string;
  manoDeObra: number;
  subtotalServicios: number;
  subtotalProductos: number;
  subtotalRepuestosExternos: number;
  total: number;
  utilidad: number;
  cliente: any;
  vehiculo: any;
  mecanico: any;
  servicios: any[];
  detalles: any[];
  repuestosExternos: any[];
}

interface Servicio {
  clave: string;
  descripcion: string;
  precio: number;
  requiereLubricacion?: boolean;
}

// Componente para agregar repuesto externo
function RepuestoExternoModal({ isOpen, onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    cantidad: 1,
    precioCompra: 0,
    precioVenta: 0,
    proveedor: "",
  });

  const calcularUtilidad = () => {
    const totalCompra = formData.cantidad * formData.precioCompra;
    const totalVenta = formData.cantidad * formData.precioVenta;
    return totalVenta - totalCompra;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || formData.precioVenta <= 0) {
      toast.error("Completa todos los campos");
      return;
    }
    onAdd({
      ...formData,
      subtotal: formData.cantidad * formData.precioVenta,
      utilidad: calcularUtilidad(),
    });
    setFormData({ nombre: "", descripcion: "", cantidad: 1, precioCompra: 0, precioVenta: 0, proveedor: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Repuesto Externo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Nombre del repuesto"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
        <Input
          placeholder="Descripción"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
        />
        <Input
          placeholder="Proveedor"
          value={formData.proveedor}
          onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            placeholder="Cantidad"
            value={formData.cantidad}
            onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
          />
          <Input
            type="number"
            placeholder="Precio Compra"
            value={formData.precioCompra}
            onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })}
          />
          <Input
            type="number"
            placeholder="Precio Venta"
            value={formData.precioVenta}
            onChange={(e) => setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Agregar</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function OrdenDetallePage() {
  const { data: session } = useSession();
  const params = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [serviciosCompletados, setServiciosCompletados] = useState<{
    [key: string]: boolean;
  }>({});
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>(
    []
  );
  const [showLubricacionModal, setShowLubricacionModal] = useState(false);
  const [servicioLubricacionTemp, setServicioLubricacionTemp] =
    useState<Servicio | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showRepuestoExternoModal, setShowRepuestoExternoModal] =
    useState(false);
  const [showAgregarServicios, setShowAgregarServicios] = useState(false);

  const canEdit = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );
  const canAddServices = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "MECANICO",
  ].includes(session?.user?.role || "");
  const isMecanico = session?.user?.role === "MECANICO";

  useEffect(() => {
    if (params.id) {
      fetchOrden();
      fetchServicios();
    }
  }, [params.id]);

  const fetchOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrden(data);

        const completados: { [key: string]: boolean } = {};
        data.servicios.forEach((s: any) => {
          completados[s.id] = s.completado || false;
        });
        setServiciosCompletados(completados);
      } else {
        toast.error("Error al cargar orden");
      }
    } catch (error) {
      toast.error("Error al cargar orden");
    } finally {
      setLoading(false);
    }
  };

  const fetchServicios = async () => {
    try {
      const response = await fetch("/api/servicios-taller");
      if (response.ok) {
        const data = await response.json();
        const servicios = data.map((s: any) => ({
          clave: s.clave,
          descripcion: s.descripcion,
          precio: parseFloat(s.valor),
          requiereLubricacion: s.clave === "SERVICIO_LUBRICACION",
        }));
        setServiciosDisponibles(servicios);
      }
    } catch (error) {
      console.error("Error fetching servicios:", error);
    }
  };

  const updateEstado = async (nuevoEstado: string) => {
    setUpdating(true);
    try {
      const updateData: any = { estado: nuevoEstado };

      if (nuevoEstado === "EN_PROCESO" && !orden?.fechaInicio) {
        updateData.fechaInicio = new Date().toISOString();
      }

      if (nuevoEstado === "COMPLETADO" && !orden?.fechaFin) {
        updateData.fechaFin = new Date().toISOString();
      }

      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success(`Orden marcada como ${nuevoEstado.toLowerCase()}`);
        fetchOrden();
      } else {
        toast.error("Error al actualizar estado");
      }
    } catch (error) {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdating(false);
    }
  };

  const toggleServicioCompletado = async (servicioId: string) => {
    try {
      const nuevoEstado = !serviciosCompletados[servicioId];

      const response = await fetch(`/api/ordenes/servicios/${servicioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completado: nuevoEstado }),
      });

      if (response.ok) {
        setServiciosCompletados({
          ...serviciosCompletados,
          [servicioId]: nuevoEstado,
        });
        toast.success(
          nuevoEstado
            ? "Servicio marcado como completado"
            : "Servicio marcado como pendiente"
        );
      } else {
        toast.error("Error al actualizar servicio");
      }
    } catch (error) {
      toast.error("Error al actualizar servicio");
    }
  };

  const agregarServicio = async (servicio: Servicio) => {
    if (servicio.requiereLubricacion) {
      setServicioLubricacionTemp(servicio);
      setShowLubricacionModal(true);
    } else {
      await agregarServicioDirecto(servicio);
    }
  };

  const agregarServicioDirecto = async (servicio: Servicio) => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: servicio.descripcion,
          precio: servicio.precio,
        }),
      });

      if (response.ok) {
        toast.success("Servicio agregado");
        fetchOrden();
        setShowAgregarServicios(false);
      } else {
        toast.error("Error al agregar servicio");
      }
    } catch (error) {
      toast.error("Error al agregar servicio");
    }
  };

  const handleLubricacionAdded = async (
    productos: Array<{ id: string; nombre: string; tipo: "ACEITE" | "FILTRO" }>,
    productosCompletos?: Array<{
      id: string;
      nombre: string;
      precioMinorista: number;
    }>
  ) => {
    if (!servicioLubricacionTemp) return;

    try {
      console.log("🔧 Agregando lubricación a orden existente:", productos);

      // Separar aceites y filtros
      const aceites = productos.filter((p) => p.tipo === "ACEITE");
      const filtros = productos.filter((p) => p.tipo === "FILTRO");

      if (aceites.length === 0 || filtros.length === 0) {
        toast.error("❌ Debe haber al menos un aceite y un filtro");
        return;
      }

      // Calcular precio total con precio MINORISTA
      const precioTotal = productosCompletos
        ? productosCompletos.reduce((sum, p) => sum + p.precioMinorista, 0)
        : 0;

      // Crear descripción detallada
      const nombresAceites = aceites.map((a) => a.nombre).join(", ");
      const nombresFiltros = filtros.map((f) => f.nombre).join(", ");

      const descripcion = `${servicioLubricacionTemp.descripcion} - Aceites: ${nombresAceites} | Filtros: ${nombresFiltros}`;

      // 🔥 Agregar servicio CON productos para descontar inventario
      const response = await fetch(`/api/ordenes/${params.id}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: descripcion,
          precio: precioTotal,
          productosLubricacion: productosCompletos, // 🔥 Enviar productos completos
        }),
      });

      if (response.ok) {
        toast.success(
          <div>
            <div className="font-semibold">
              ✅ Servicio de lubricación agregado
            </div>
            <div className="text-sm mt-1">
              <div>
                • {aceites.length} aceite{aceites.length > 1 ? "s" : ""}
              </div>
              <div>
                • {filtros.length} filtro{filtros.length > 1 ? "s" : ""}
              </div>
              <div className="font-semibold mt-1">
                Total (Precio Minorista): ${precioTotal.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Stock descontado automáticamente
              </div>
            </div>
          </div>,
          { duration: 5000 }
        );
        fetchOrden(); // Recargar orden
        setShowAgregarServicios(false);
      } else {
        toast.error("Error al agregar servicio");
      }
    } catch (error) {
      console.error("❌ Error al agregar lubricación:", error);
      toast.error("Error al agregar servicio de lubricación");
    } finally {
      setServicioLubricacionTemp(null);
    }
  };

  const handleProductSelected = async (producto: any, tipoPrecio: string) => {
    try {
      const precio =
        tipoPrecio === "MINORISTA"
          ? producto.precioMinorista
          : tipoPrecio === "MAYORISTA"
            ? producto.precioMayorista
            : producto.precioVenta;

      const response = await fetch(`/api/ordenes/${params.id}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: producto.id,
          cantidad: 1,
          precioUnitario: precio,
          tipoPrecio,
        }),
      });

      if (response.ok) {
        toast.success(`${producto.nombre} agregado a la orden`);
        fetchOrden();
        setShowProductSelector(false);
      } else {
        toast.error("Error al agregar producto");
      }
    } catch (error) {
      toast.error("Error al agregar producto");
    }
  };

  const handleRepuestoExternoAdded = async (repuesto: any) => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}/repuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repuesto),
      });

      if (response.ok) {
        toast.success("Repuesto externo agregado");
        fetchOrden();
        setShowRepuestoExternoModal(false);
      } else {
        toast.error("Error al agregar repuesto");
      }
    } catch (error) {
      toast.error("Error al agregar repuesto");
    }
  };

  const removerServicio = async (servicioId: string) => {
    if (!confirm("¿Deseas eliminar este servicio?")) return;

    try {
      const response = await fetch(
        `/api/ordenes/${params.id}/servicios/${servicioId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Servicio removido");
        fetchOrden();
      } else {
        toast.error("Error al eliminar servicio");
      }
    } catch (error) {
      toast.error("Error al eliminar servicio");
    }
  };

  const eliminarOrden = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta orden cancelada? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Orden eliminada correctamente");
        window.location.href = "/ordenes";
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al eliminar orden");
      }
    } catch (error) {
      toast.error("Error al eliminar orden");
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "EN_PROCESO":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 animate-pulse">
            <Wrench className="h-3 w-3 mr-1" />
            En Proceso
          </Badge>
        );
      case "COMPLETADO":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 animate-pulse">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        );
      case "CANCELADO":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Orden no encontrada
        </h2>
        <Link href="/ordenes">
          <Button size="sm" className="hover:scale-105 transition-transform">
            Volver a Órdenes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 टीम प-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center space-x-4">
          <Link href="/ordenes">
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {orden.numeroOrden}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Orden de trabajo
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getEstadoBadge(orden.estado)}
          {canEdit && (
            <Link href={`/ordenes/${orden.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-transform"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Estado Actions */}
      {canEdit &&
        orden.estado !== "COMPLETADO" &&
        orden.estado !== "CANCELADO" && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Cambiar Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {orden.estado === "PENDIENTE" && (
                  <Button
                    onClick={() => updateEstado("EN_PROCESO")}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-transform w-full sm:w-auto"
                    size="sm"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Iniciar Trabajo
                  </Button>
                )}
                {orden.estado === "EN_PROCESO" && (
                  <Button
                    onClick={() => updateEstado("COMPLETADO")}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform w-full sm:w-auto"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar Completado
                  </Button>
                )}
                <Button
                  onClick={() => updateEstado("CANCELADO")}
                  disabled={updating}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform w-full sm:w-auto"
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancelar Orden
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="w-full animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <User className="h-5 w-5 text-blue-600" />
              <span>Cliente y Vehículo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                {orden.cliente.nombre}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {orden.cliente.telefono && (
                  <div>📞 {orden.cliente.telefono}</div>
                )}
                {orden.cliente.email && <div>📧 {orden.cliente.email}</div>}
                {orden.cliente.numeroDocumento && (
                  <div>
                    {orden.cliente.tipoDocumento}:{" "}
                    {orden.cliente.numeroDocumento}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 flex items-center space-x-2 text-base sm:text-lg">
                <Car className="h-4 w-4" />
                <span>
                  {orden.vehiculo.marca} {orden.vehiculo.modelo}
                </span>
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Placa: {orden.vehiculo.placa}</div>
                {orden.vehiculo.año && <div>Año: {orden.vehiculo.año}</div>}
                {orden.vehiculo.color && (
                  <div>Color: {orden.vehiculo.color}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Información de la Orden</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mecánico:</span>
                <div className="font-medium">{orden.mecanico.name}</div>
              </div>
              <div>
                <span className="text-gray-600">Fecha Creación:</span>
                <div className="font-medium">
                  {new Date(orden.fechaCreacion).toLocaleDateString("es-CO")}
                </div>
              </div>
              {orden.fechaInicio && (
                <div>
                  <span className="text-gray-600">Fecha Inicio:</span>
                  <div className="font-medium">
                    {new Date(orden.fechaInicio).toLocaleDateString("es-CO")}
                  </div>
                </div>
              )}
              {orden.fechaFin && (
                <div>
                  <span className="text-gray-600">Fecha Fin:</span>
                  <div className="font-medium">
                    {new Date(orden.fechaFin).toLocaleDateString("es-CO")}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">
                Descripción:
              </h5>
              <p className="text-gray-600 text-sm whitespace-normal break-words">
                {orden.descripcion}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servicios con opción de agregar */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-green-600" />
              <span className="text-lg sm:text-xl">Servicios</span>
              <span className="text-sm text-gray-600">
                {Object.values(serviciosCompletados).filter(Boolean).length} de{" "}
                {orden.servicios.length} completados
              </span>
            </div>
            {canAddServices && (
              <Button
                size="sm"
                onClick={() => setShowAgregarServicios(!showAgregarServicios)}
                className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Servicio
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de servicios disponibles para agregar */}
          {showAgregarServicios && canAddServices && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 mb-3 text-base sm:text-lg">
                Servicios Disponibles:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {serviciosDisponibles.map((servicio) => (
                  <button
                    key={servicio.clave}
                    onClick={() => agregarServicio(servicio)}
                    disabled={orden.servicios.some(
                      (s) => s.descripcion === servicio.descripcion
                    )}
                    className="flex items-center justify-between p-3 border-2 border-blue-300 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full min-w-0"
                  >
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm sm:text-base whitespace-normal break-words">
                        {servicio.descripcion}
                      </div>
                      {!servicio.requiereLubricacion && (
                        <div className="text-sm text-gray-500">
                          ${servicio.precio.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-green-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Servicios de la orden */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orden.servicios.map((servicio: any) => (
              <div
                key={servicio.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${
                  serviciosCompletados[servicio.id]
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 w-full">
                  {!isMecanico && (
                    <Checkbox
                      checked={serviciosCompletados[servicio.id] || false}
                      onCheckedChange={() =>
                        toggleServicioCompletado(servicio.id)
                      }
                      className="h-5 w-5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`font-medium text-sm sm:text-base whitespace-normal break-words ${
                        serviciosCompletados[servicio.id]
                          ? "text-green-800 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {servicio.descripcion}
                    </span>
                    {serviciosCompletados[servicio.id] && (
                      <div className="flex items-center mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-xs text-green-600 font-medium">
                          Completado
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-between sm:justify-end">
                  {!isMecanico && (
                    <span className="font-bold text-green-600 text-sm sm:text-base">
                      ${servicio.precio.toLocaleString()}
                    </span>
                  )}
                  {canAddServices && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removerServicio(servicio.id)}
                      className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Productos */}
      {orden.detalles.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Productos</span>
              </div>
              {canAddServices && orden.estado !== "COMPLETADO" && (
                <Button
                  size="sm"
                  onClick={() => setShowProductSelector(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 min-w-0">
                        Producto
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                        Cantidad
                      </th>
                      {!isMecanico && (
                        <>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                            Precio Unit.
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                            Subtotal
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orden.detalles.map((detalle: any) => (
                      <tr key={detalle.id} className="border-b border-gray-100">
                        <td className="py-3 px-3 min-w-0">
                          <div className="whitespace-normal break-words">
                            <div className="font-medium text-sm sm:text-base">
                              {detalle.producto.nombre}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {detalle.producto.codigo}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-sm sm:text-base">
                          {detalle.cantidad}
                        </td>
                        {!isMecanico && (
                          <>
                            <td className="py-3 px-3 font-medium text-blue-600 text-sm sm:text-base">
                              ${detalle.precioUnitario.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-blue-600 text-sm sm:text-base">
                              ${detalle.subtotal.toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden space-y-4">
                {orden.detalles.map((detalle: any) => (
                  <div
                    key={detalle.id}
                    className="border-b border-gray-100 pb-4 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm sm:text-base whitespace-normal break-words">
                        {detalle.producto.nombre}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {detalle.producto.codigo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm sm:text-base">
                        <span className="font-medium">Cantidad: </span>
                        {detalle.cantidad}
                      </div>
                      {!isMecanico && (
                        <div className="text-sm sm:text-base text-right">
                          <div>
                            <span className="font-medium">Precio Unit.: </span>$
                            {detalle.precioUnitario.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Subtotal: </span>
                            <span className="font-bold text-blue-600">
                              ${detalle.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repuestos Externos */}
      {orden.repuestosExternos.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Repuestos Externos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 min-w-0">
                        Repuesto
                      </th>
                      {!isMecanico && (
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          Proveedor
                        </th>
                      )}
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                        Cantidad
                      </th>
                      {!isMecanico && (
                        <>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                            Precio Unit.
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                            Subtotal
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orden.repuestosExternos.map((repuesto: any) => (
                      <tr
                        key={repuesto.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 px-3 min-w-0">
                          <div className="whitespace-normal break-words">
                            <div className="font-medium text-sm sm:text-base">
                              {repuesto.nombre}
                            </div>
                            {repuesto.descripcion && (
                              <div className="text-xs sm:text-sm text-gray-500">
                                {repuesto.descripcion}
                              </div>
                            )}
                          </div>
                        </td>
                        {!isMecanico && (
                          <td className="py-3 px-3 text-sm text-gray-600 whitespace-normal break-words">
                            {repuesto.proveedor}
                          </td>
                        )}
                        <td className="py-3 px-3 font-medium text-sm sm:text-base">
                          {repuesto.cantidad}
                        </td>
                        {!isMecanico && (
                          <>
                            <td className="py-3 px-3 font-medium text-orange-600 text-sm sm:text-base">
                              ${repuesto.precioUnitario.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-orange-600 text-sm sm:text-base">
                              ${repuesto.subtotal.toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden space-y-4">
                {orden.repuestosExternos.map((repuesto: any) => (
                  <div
                    key={repuesto.id}
                    className="border-b border-gray-100 pb-4 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm sm:text-base whitespace-normal break-words">
                        {repuesto.nombre}
                      </span>
                      {repuesto.descripcion && (
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-normal break-words">
                          {repuesto.descripcion}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm sm:text-base flex flex-col">
                        {!isMecanico && (
                          <div>
                            <span className="font-medium">Proveedor: </span>
                            {repuesto.proveedor}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Cantidad: </span>
                          {repuesto.cantidad}
                        </div>
                      </div>
                      {!isMecanico && (
                        <div className="text-sm sm:text-base text-right">
                          <div>
                            <span className="font-medium">Precio Unit.: </span>$
                            {repuesto.precioUnitario.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Subtotal: </span>
                            <span className="font-bold text-orange-600">
                              ${repuesto.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totales - Solo para Admin */}
      {!isMecanico && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span>Resumen Financiero</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Servicios</div>
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  ${orden.subtotalServicios.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Productos</div>
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  ${orden.subtotalProductos.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Repuestos Ext.</div>
                <div className="text-lg sm:text-xl font-bold text-orange-600">
                  ${orden.subtotalRepuestosExternos.toLocaleString()}
                </div>
              </div>
              {orden.manoDeObra > 0 && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Mano de Obra</div>
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    ${orden.manoDeObra.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-base sm:text-lg">
                <span className="font-semibold text-gray-700">Total:</span>
                <span className="text-lg sm:text-2xl font-bold text-purple-600">
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
      )}

      {/* Modal de lubricación */}
      <LubricacionModal
        isOpen={showLubricacionModal}
        onClose={() => {
          setShowLubricacionModal(false);
          setServicioLubricacionTemp(null);
        }}
        onAdd={handleLubricacionAdded}
      />
      <ProductSelectorModal
        isOpen={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={handleProductSelected}
      />

      <RepuestoExternoModal
        isOpen={showRepuestoExternoModal}
        onClose={() => setShowRepuestoExternoModal(false)}
        onAdd={handleRepuestoExternoAdded}
      />
    </div>
  );
}
