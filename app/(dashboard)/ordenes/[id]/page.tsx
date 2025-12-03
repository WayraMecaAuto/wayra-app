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

// Interfaces...
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

// Componente RepuestoExternoModal...
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
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    onAdd({
      ...formData,
      subtotal: formData.cantidad * formData.precioVenta,
      utilidad: calcularUtilidad(),
    });
    setFormData({
      nombre: "",
      descripcion: "",
      cantidad: 1,
      precioCompra: 0,
      precioVenta: 0,
      proveedor: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg sm:max-w-xl md:max-w-2xl overflow-hidden border border-gray-200 animate-slide-up">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <h2 className="text-lg sm:text-xl font-semibold">
            Agregar Repuesto Externo
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-white"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del repuesto *
              </label>
              <Input
                placeholder="Ej. Bujía NGK"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <Input
                placeholder="Ej. Importadora XYZ"
                value={formData.proveedor}
                onChange={(e) =>
                  setFormData({ ...formData, proveedor: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              placeholder="Detalles adicionales..."
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={2}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <Input
                type="number"
                min={1}
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cantidad: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Compra
              </label>
              <Input
                type="number"
                min={0}
                value={formData.precioCompra}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precioCompra: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Venta *
              </label>
              <Input
                type="number"
                min={0}
                value={formData.precioVenta}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precioVenta: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6"
            >
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdenDetallePage() {
  const { data: session } = useSession();
  const params = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editando, setEditando] = useState<{ tipo: string; id: string } | null>(
    null
  );
  const [precioTemporal, setPrecioTemporal] = useState<number>(0);

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

  // PERMISOS ACTUALIZADOS PARA MECANICO
  const canEdit = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );

  const canAddServices = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "MECANICO",
  ].includes(session?.user?.role || "");

  const isMecanico = session?.user?.role === "MECANICO";

  // NUEVOS PERMISOS ESPECÍFICOS
  const canCheckServices = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "MECANICO", //  Mecánico puede marcar servicios completados
  ].includes(session?.user?.role || "");

  const canAddProducts = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );

  const canChangeStatus = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "MECANICO", //  Mecánico puede cambiar estado de la orden
  ].includes(session?.user?.role || "");

  //  Verificar si la orden está completada
  const isCompletado = orden?.estado === "COMPLETADO";
  const canModify = !isCompletado && canEdit;
  const canAddItems = !isCompletado && canAddProducts; // Solo admins

  const canAddInventoryItems = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );

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
    if (isCompletado && nuevoEstado !== "CANCELADO") {
      toast.error("No se puede modificar una orden completada");
      return;
    }

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
    if (isCompletado) {
      toast.error("No se puede modificar una orden completada");
      return;
    }

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

  const handleLubricacionAdded = async (data: {
    productosInventario: Array<{
      id: string;
      nombre: string;
      cantidad: number;
      precio: number;
      tipoPrecio: string;
    }>;
    repuestosExternos: Array<{
      nombre: string;
      descripcion: string;
      cantidad: number;
      precioCompra: number;
      precioVenta: number;
      proveedor: string;
    }>;
    precioManoObra: number;
  }) => {
    try {
      console.log("🔧 Procesando lubricación en orden existente:", data);

      for (const prod of data.productosInventario) {
        const response = await fetch(`/api/ordenes/${params.id}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: prod.id,
            cantidad: prod.cantidad,
            precioUnitario: prod.precio,
            tipoPrecio: prod.tipoPrecio,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al agregar producto ${prod.nombre}`);
        }
        console.log(`✅ Producto agregado: ${prod.nombre}`);
      }

      for (const rep of data.repuestosExternos) {
        const response = await fetch(`/api/ordenes/${params.id}/repuestos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: rep.nombre,
            descripcion: rep.descripcion,
            cantidad: rep.cantidad,
            precioCompra: rep.precioCompra,
            precioVenta: rep.precioVenta,
            subtotal: rep.precioVenta * rep.cantidad,
            utilidad: (rep.precioVenta - rep.precioCompra) * rep.cantidad,
            proveedor: rep.proveedor,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al agregar repuesto ${rep.nombre}`);
        }
        console.log(`✅ Repuesto externo agregado: ${rep.nombre}`);
      }

      if (data.precioManoObra > 0) {
        const response = await fetch(`/api/ordenes/${params.id}/servicios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descripcion: "Mano de Obra - Lubricación",
            precio: data.precioManoObra,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al agregar servicio de mano de obra");
        }
        console.log(`✅ Mano de obra agregada: $${data.precioManoObra}`);
      }

      toast.success(
        <div>
          <div className="font-semibold">
            ✅ Lubricación agregada correctamente
          </div>
          <div className="text-sm mt-1">
            <div>
              • {data.productosInventario.length} productos del inventario
            </div>
            <div>• {data.repuestosExternos.length} repuestos externos</div>
            {data.precioManoObra > 0 && (
              <div>• Mano de obra: ${data.precioManoObra.toLocaleString()}</div>
            )}
          </div>
        </div>,
        { duration: 6000 }
      );

      fetchOrden();
      setShowAgregarServicios(false);
    } catch (error) {
      console.error("❌ Error al agregar lubricación:", error);
      toast.error("Error al agregar lubricación");
    }
  };

  const handleProductSelected = async (
    producto: any,
    cantidad: number,
    precioPersonalizado?: number
  ) => {
    try {
      // Usar precio personalizado si se proporciona
      let precio = precioPersonalizado || producto.precioVenta;

      const response = await fetch(`/api/ordenes/${params.id}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: producto.id,
          cantidad: cantidad, // ✅ Enviar cantidad del modal
          precioUnitario: precio,
          tipoPrecio: "VENTA",
        }),
      });

      if (response.ok) {
        toast.success(
          `${producto.nombre} agregado (${cantidad} unidades)${precioPersonalizado ? " con precio personalizado" : ""}`
        );
        fetchOrden();
        setShowProductSelector(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al agregar producto");
      }
    } catch (error) {
      console.error("Error:", error);
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

  const eliminarServicio = async (servicioId: string) => {
    if (isCompletado) {
      toast.error("No se puede modificar una orden completada");
      return;
    }

    if (!confirm("¿Eliminar este servicio?")) return;

    try {
      const response = await fetch(
        `/api/ordenes/${orden.id}/servicios/${servicioId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success("Servicio eliminado");
        fetchOrden();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const eliminarProducto = async (detalleId: string) => {
    if (isCompletado) {
      toast.error("No se puede modificar una orden completada");
      return;
    }

    if (!confirm("¿Eliminar este producto? El stock será devuelto.")) return;

    try {
      const response = await fetch(
        `/api/ordenes/${orden.id}/productos/${detalleId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success("Producto eliminado, stock devuelto");
        fetchOrden();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const eliminarRepuesto = async (repuestoId: string) => {
    if (isCompletado) {
      toast.error("No se puede modificar una orden completada");
      return;
    }

    if (!confirm("¿Eliminar este repuesto externo?")) return;

    try {
      const response = await fetch(
        `/api/ordenes/${orden.id}/repuestos/${repuestoId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success("Repuesto eliminado");
        fetchOrden();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const actualizarPrecioMomentaneo = (
    tipo: "servicios" | "productos" | "repuestos",
    id: string,
    nuevoPrecio: number
  ) => {
    if (isCompletado) {
      toast.error("No se puede modificar una orden completada");
      return;
    }

    if (!orden) return;
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      toast.error("Precio inválido");
      return;
    }

    let nuevaOrden = { ...orden };

    if (tipo === "servicios") {
      nuevaOrden.servicios = orden.servicios.map((s) =>
        s.id === id ? { ...s, precio: nuevoPrecio } : s
      );
    } else if (tipo === "productos") {
      nuevaOrden.detalles = orden.detalles.map((d) =>
        d.id === id
          ? {
              ...d,
              precioUnitario: nuevoPrecio,
              subtotal: nuevoPrecio * d.cantidad,
            }
          : d
      );
    } else if (tipo === "repuestos") {
      nuevaOrden.repuestosExternos = orden.repuestosExternos.map((r) =>
        r.id === id
          ? {
              ...r,
              precioUnitario: nuevoPrecio,
              subtotal: nuevoPrecio * r.cantidad,
            }
          : r
      );
    }

    const subtotalServicios = nuevaOrden.servicios.reduce(
      (sum, s) => sum + s.precio,
      0
    );
    const subtotalProductos = nuevaOrden.detalles.reduce(
      (sum, d) => sum + d.subtotal,
      0
    );
    const subtotalRepuestosExternos = nuevaOrden.repuestosExternos.reduce(
      (sum, r) => sum + r.subtotal,
      0
    );
    const total =
      subtotalServicios +
      subtotalProductos +
      subtotalRepuestosExternos +
      (nuevaOrden.manoDeObra || 0);

    setOrden({
      ...nuevaOrden,
      subtotalServicios,
      subtotalProductos,
      subtotalRepuestosExternos,
      total,
    });

    setEditando(null);
    toast.success("💰 Precio actualizado temporalmente");
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
    <div className="container mx-auto space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl">
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
              Orden de trabajo{" "}
              {isCompletado && " - 🔒 Completada (solo lectura)"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getEstadoBadge(orden.estado)}
          {canEdit && !isCompletado && (
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
      {canChangeStatus &&
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
                {canEdit && (
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
                )}
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
            {canAddItems && (
              <Button
                size="sm"
                onClick={() => setShowAgregarServicios(!showAgregarServicios)}
                disabled={isCompletado}
                className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Servicio
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de servicios disponibles para agregar */}
          {showAgregarServicios && canAddItems && !isCompletado && (
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
                  {canCheckServices && !isCompletado && (
                    <Checkbox
                      checked={serviciosCompletados[servicio.id] || false}
                      onCheckedChange={() =>
                        toggleServicioCompletado(servicio.id)
                      }
                      className="h-5 w-5"
                      disabled={isCompletado}
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
                    <div className="flex items-center space-x-2">
                      {editando?.tipo === "servicios" &&
                      editando.id === servicio.id &&
                      !isCompletado ? (
                        <>
                          <input
                            type="number"
                            className="border rounded-md px-2 py-1 w-24 text-sm"
                            value={precioTemporal}
                            onChange={(e) =>
                              setPrecioTemporal(parseFloat(e.target.value) || 0)
                            }
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              actualizarPrecioMomentaneo(
                                "servicios",
                                servicio.id,
                                precioTemporal
                              )
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-green-600 text-sm sm:text-base">
                            ${servicio.precio.toLocaleString()}
                          </span>
                          {canModify && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setEditando({
                                  tipo: "servicios",
                                  id: servicio.id,
                                });
                                setPrecioTemporal(servicio.precio);
                              }}
                              className="p-1"
                              disabled={isCompletado}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {canAddItems && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => eliminarServicio(servicio.id)}
                      disabled={isCompletado}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
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
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Productos</span>
            </div>

            {canAddInventoryItems && !isCompletado && (
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

        {orden.detalles.length > 0 ? (
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              {/* Vista escritorio */}
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
                          <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                            Acciones
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
                            <td className="py-3 px-3">
                              {editando?.tipo === "productos" &&
                              editando.id === detalle.id &&
                              !isCompletado ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    className="border rounded-md px-2 py-1 w-24 text-sm"
                                    value={precioTemporal}
                                    onChange={(e) =>
                                      setPrecioTemporal(
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      actualizarPrecioMomentaneo(
                                        "productos",
                                        detalle.id,
                                        precioTemporal
                                      )
                                    }
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-600 text-sm sm:text-base">
                                    ${detalle.precioUnitario.toLocaleString()}
                                  </span>
                                  {canModify && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        setEditando({
                                          tipo: "productos",
                                          id: detalle.id,
                                        });
                                        setPrecioTemporal(
                                          detalle.precioUnitario
                                        );
                                      }}
                                      className="p-1"
                                      disabled={isCompletado}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 font-bold text-blue-600 text-sm sm:text-base">
                              ${detalle.subtotal.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {canAddServices && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => eliminarProducto(detalle.id)}
                                  disabled={isCompletado}
                                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil - continúa igual */}
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
                          <div className="flex items-center justify-end space-x-2">
                            {editando?.tipo === "productos" &&
                            editando.id === detalle.id &&
                            !isCompletado ? (
                              <>
                                <input
                                  type="number"
                                  className="border rounded-md px-2 py-1 w-24 text-sm"
                                  value={precioTemporal}
                                  onChange={(e) =>
                                    setPrecioTemporal(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    actualizarPrecioMomentaneo(
                                      "productos",
                                      detalle.id,
                                      precioTemporal
                                    )
                                  }
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="font-medium text-blue-600">
                                  ${detalle.precioUnitario.toLocaleString()}
                                </span>
                                {canModify && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditando({
                                        tipo: "productos",
                                        id: detalle.id,
                                      });
                                      setPrecioTemporal(detalle.precioUnitario);
                                    }}
                                    className="p-1"
                                    disabled={isCompletado}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">Subtotal: </span>
                            <span className="font-bold text-blue-600">
                              ${detalle.subtotal.toLocaleString()}
                            </span>
                          </div>
                          {canAddServices && !isCompletado && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => eliminarProducto(detalle.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="text-center text-gray-500 py-8">
            <div className="flex flex-col items-center space-y-2">
              <Package className="h-8 w-8 text-blue-400" />
              <p>No hay productos agregados aún.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Repuestos Externos */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Repuestos Externos</span>
            </div>
            {canAddInventoryItems && !isCompletado && (
              <Button
                size="sm"
                onClick={() => setShowRepuestoExternoModal(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Repuesto Externo
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        {orden.repuestosExternos.length > 0 ? (
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              {/* Vista desktop */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 min-w-0">
                        Repuesto
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                        Proveedor
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                        Cantidad
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                        P. Venta
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                        Subtotal
                      </th>
                      {canAddItems && (
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orden.repuestosExternos.map((repuesto: any, index) => (
                      <tr
                        key={repuesto.id}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 px-3 min-w-0">
                          <div className="whitespace-normal break-words">
                            <div className="font-medium text-sm sm:text-base text-gray-900">
                              {repuesto.nombre}
                            </div>
                            {repuesto.descripcion && (
                              <div className="text-xs sm:text-sm text-gray-500">
                                {repuesto.descripcion}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm sm:text-base text-gray-600 whitespace-normal break-words">
                          {repuesto.proveedor || "-"}
                        </td>
                        <td className="py-3 px-3 font-medium text-sm sm:text-base">
                          {repuesto.cantidad}
                        </td>
                        <td className="py-3 px-3 font-medium text-orange-600 text-sm sm:text-base">
                          ${repuesto.precioVenta.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-orange-600 text-sm sm:text-base">
                          ${repuesto.subtotal.toLocaleString()}
                        </td>
                        {canAddItems && (
                          <td className="py-3 px-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => eliminarRepuesto(repuesto.id)}
                              disabled={isCompletado}
                              className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="lg:hidden space-y-4">
                {orden.repuestosExternos.map((repuesto: any) => (
                  <div
                    key={repuesto.id}
                    className="border-b border-gray-100 pb-4 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm sm:text-base text-gray-900 whitespace-normal break-words">
                        {repuesto.nombre}
                      </span>
                      {repuesto.descripcion && (
                        <span className="text-xs sm:text-sm text-gray-500 whitespace-normal break-words">
                          {repuesto.descripcion}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm sm:text-base flex flex-col">
                        <div>
                          <span className="font-medium">Proveedor: </span>
                          {repuesto.proveedor || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Cantidad: </span>
                          {repuesto.cantidad}
                        </div>
                      </div>
                      <div className="text-sm sm:text-base text-right">
                        <div>
                          <span className="font-medium">P. Venta: </span>
                          <span className="text-orange-600">
                            ${repuesto.precioVenta.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Subtotal: </span>
                          <span className="font-bold text-orange-600">
                            ${repuesto.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canAddItems && !isCompletado && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => eliminarRepuesto(repuesto.id)}
                          className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="text-center text-gray-500 py-8">
            <div className="flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8 text-orange-400" />
              <p>No hay repuestos externos agregados aún.</p>
            </div>
          </CardContent>
        )}
      </Card>

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

      {/* Modales */}
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
