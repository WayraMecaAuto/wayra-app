"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Wrench,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LubricacionModal } from "@/components/forms/LubricacionModal";
import { ProductSelectorModal } from "@/components/forms/ProductSelectorModal";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import toast from "react-hot-toast";

interface EditOrdenForm {
  descripcion: string;
  mecanicoId: string;
  manoDeObra: string;
}

interface ServicioEditable {
  id?: string;
  clave?: string;
  descripcion: string;
  precio: number;
  isNew?: boolean;
  requiereLubricacion?: boolean;
}

interface ProductoOrden {
  id: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
  isNew?: boolean;
}

interface RepuestoExterno {
  id: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  subtotal: number;
  utilidad: number;
  proveedor: string;
  isNew?: boolean;
}

export default function EditOrdenPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [orden, setOrden] = useState<any>(null);
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<any[]>([]);
  const [serviciosOrden, setServiciosOrden] = useState<ServicioEditable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLubricacionModal, setShowLubricacionModal] = useState(false);
  const [servicioLubricacionTemp, setServicioLubricacionTemp] =
    useState<any>(null);

  // Estados para productos y repuestos
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showRepuestoExternoModal, setShowRepuestoExternoModal] =
    useState(false);
  const [productosOrden, setProductosOrden] = useState<ProductoOrden[]>([]);
  const [repuestosOrden, setRepuestosOrden] = useState<RepuestoExterno[]>([]);

  const canEdit = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );
  const canEditServicios = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "MECANICO",
  ].includes(session?.user?.role || "");
  const isMecanico = session?.user?.role === "MECANICO";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EditOrdenForm>();

  useEffect(() => {
    if (params.id) {
      fetchOrden();
      fetchMecanicos();
      fetchServicios();
    }
  }, [params.id]);

  const fetchOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrden(data);
        setValue("descripcion", data.descripcion);
        setValue("mecanicoId", data.mecanicoId);
        setValue("manoDeObra", data.manoDeObra?.toString() || "0");

        // Cargar servicios existentes
        setServiciosOrden(
          data.servicios.map((s: any) => ({
            id: s.id,
            descripcion: s.descripcion,
            precio: s.precio,
            isNew: false,
          }))
        );

        // Cargar productos existentes (marcar como NO nuevos)
        setProductosOrden(
          data.detalles.map((d: any) => ({
            id: d.id,
            productoId: d.productoId,
            nombre: d.producto.nombre,
            codigo: d.producto.codigo,
            cantidad: d.cantidad,
            precioVenta: d.precioUnitario,
            subtotal: d.subtotal,
            isNew: false, // ✅ Importante
          }))
        );

        // Cargar repuestos externos existentes (marcar como NO nuevos)
        setRepuestosOrden(
          data.repuestosExternos.map((r: any) => ({
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion || "",
            cantidad: r.cantidad,
            precioCompra: r.precioCompra,
            precioVenta: r.precioVenta,
            subtotal: r.subtotal,
            utilidad: r.utilidad,
            proveedor: r.proveedor || "",
            isNew: false, // ✅ Importante
          }))
        );
      } else {
        toast.error("Error al cargar orden");
      }
    } catch (error) {
      toast.error("Error al cargar orden");
    } finally {
      setLoading(false);
    }
  };

  const fetchMecanicos = async () => {
    try {
      const response = await fetch("/api/mecanicos");
      if (response.ok) {
        const data = await response.json();
        setMecanicos(data);
      }
    } catch (error) {
      console.error("Error fetching mecánicos:", error);
    }
  };

  const fetchServicios = async () => {
    try {
      const response = await fetch("/api/servicios-taller");
      if (response.ok) {
        const data = await response.json();
        setServiciosDisponibles(
          data.map((s: any) => ({
            ...s,
            requiereLubricacion: s.clave === "SERVICIO_LUBRICACION",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching servicios:", error);
    }
  };

  const agregarServicio = async (servicio: any) => {
    if (servicio.requiereLubricacion) {
      setServicioLubricacionTemp(servicio);
      setShowLubricacionModal(true);
    } else {
      const nuevoServicio: ServicioEditable = {
        clave: servicio.clave,
        descripcion: servicio.descripcion,
        precio: parseFloat(servicio.valor),
        isNew: true,
      };
      setServiciosOrden([...serviciosOrden, nuevoServicio]);
      toast.success("Servicio agregado - Puedes editar el precio");
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
      console.log("🔧 Procesando lubricación en edición:", data);

      // ✅ Validar que productosInventario sea un array
      const productosInventario = Array.isArray(data.productosInventario)
        ? data.productosInventario
        : [];

      const repuestosExternos = Array.isArray(data.repuestosExternos)
        ? data.repuestosExternos
        : [];

      // Validaciones
      const aceites = productosInventario.filter(
        (p) =>
          p.nombre.toLowerCase().includes("aceite") ||
          p.nombre.toLowerCase().includes("oil")
      );

      const filtros = productosInventario.filter(
        (p) =>
          p.nombre.toLowerCase().includes("filtro") ||
          p.nombre.toLowerCase().includes("filter")
      );

      if (
        aceites.length === 0 &&
        repuestosExternos.filter((r) =>
          r.nombre.toLowerCase().includes("aceite")
        ).length === 0
      ) {
        toast.error("❌ Debe haber al menos un aceite");
        return;
      }

      if (
        filtros.length === 0 &&
        repuestosExternos.filter((r) =>
          r.nombre.toLowerCase().includes("filtro")
        ).length === 0
      ) {
        toast.error("❌ Debe haber al menos un filtro");
        return;
      }

      // 1️⃣ AGREGAR PRODUCTOS DEL INVENTARIO
      for (const prod of productosInventario) {
        const response = await fetch(`/api/ordenes/${params.id}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: prod.id,
            cantidad: prod.cantidad,
            precioUnitario: prod.precio,
            tipoPrecio: prod.tipoPrecio || "MINORISTA",
          }),
        });

        if (!response.ok) {
          throw new Error(`Error al agregar producto ${prod.nombre}`);
        }
        console.log(`✅ Producto agregado: ${prod.nombre}`);
      }

      // 2️⃣ AGREGAR REPUESTOS EXTERNOS
      for (const rep of repuestosExternos) {
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

      // 3️⃣ AGREGAR SERVICIO DE MANO DE OBRA (si es mayor a 0)
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
            <div>• {productosInventario.length} productos del inventario</div>
            <div>• {repuestosExternos.length} repuestos externos</div>
            {data.precioManoObra > 0 && (
              <div>• Mano de obra: ${data.precioManoObra.toLocaleString()}</div>
            )}
          </div>
        </div>,
        { duration: 6000 }
      );

      fetchOrden();
    } catch (error) {
      console.error("❌ Error al agregar lubricación:", error);
      toast.error("Error al agregar lubricación");
    }
  };

  const removerServicio = (index: number) => {
    setServiciosOrden(serviciosOrden.filter((_, i) => i !== index));
    toast.success("Servicio removido");
  };

  const actualizarPrecioServicio = (index: number, nuevoPrecio: number) => {
    const nuevosServicios = [...serviciosOrden];
    nuevosServicios[index].precio = nuevoPrecio;
    setServiciosOrden(nuevosServicios);
  };

  const calcularTotalServicios = () => {
    return serviciosOrden.reduce((sum, s) => sum + s.precio, 0);
  };

  // Funciones para Productos
  const handleProductSelected = (
    producto: any,
    cantidad: number,
    precioPersonalizado?: number
  ) => {
    const existe = productosOrden.find(
      (p) => p.productoId === producto.id || p.id === producto.id
    );
    if (existe) {
      toast.error("Este producto ya está agregado");
      return;
    }

    const precio = precioPersonalizado || producto.precioVenta;

    const nuevoProducto: ProductoOrden = {
      id: `temp-${Date.now()}`,
      productoId: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      cantidad: cantidad,
      precioVenta: precio,
      subtotal: precio * cantidad,
      isNew: true,
    };

    setProductosOrden([...productosOrden, nuevoProducto]);
    toast.success(`${producto.nombre} agregado (${cantidad} unidades)`);
  };

  const actualizarPrecioProducto = (index: number, nuevoPrecio: number) => {
    const nuevosProductos = [...productosOrden];
    nuevosProductos[index].precioVenta = nuevoPrecio;
    nuevosProductos[index].subtotal =
      nuevosProductos[index].cantidad * nuevoPrecio;
    setProductosOrden(nuevosProductos);
  };

  const removerProducto = (index: number) => {
    setProductosOrden(productosOrden.filter((_, i) => i !== index));
    toast.success("Producto removido");
  };

  const calcularTotalProductos = () => {
    return productosOrden.reduce((sum, p) => sum + p.subtotal, 0);
  };

  // Funciones para Repuestos Externos
  const agregarRepuestoExterno = (repuesto: RepuestoExterno) => {
    setRepuestosOrden([
      ...repuestosOrden,
      {
        ...repuesto,
        id: `temp-${Date.now()}`,
        isNew: true,
      },
    ]);
    toast.success("Repuesto externo agregado");
  };

  const actualizarCantidadProducto = (index: number, nuevaCantidad: number) => {
    const nuevosProductos = [...productosOrden];
    nuevosProductos[index].cantidad = nuevaCantidad;
    nuevosProductos[index].subtotal =
      nuevosProductos[index].cantidad * nuevosProductos[index].precioVenta;
    setProductosOrden(nuevosProductos);
  };

  const actualizarPrecioRepuesto = (index: number, nuevoPrecio: number) => {
    const nuevosRepuestos = [...repuestosOrden];
    nuevosRepuestos[index].precioVenta = nuevoPrecio;
    nuevosRepuestos[index].subtotal =
      nuevosRepuestos[index].cantidad * nuevoPrecio;
    nuevosRepuestos[index].utilidad =
      nuevosRepuestos[index].subtotal -
      nuevosRepuestos[index].cantidad * nuevosRepuestos[index].precioCompra;
    setRepuestosOrden(nuevosRepuestos);
  };

  const actualizarCantidadRepuesto = (index: number, nuevaCantidad: number) => {
    const nuevosRepuestos = [...repuestosOrden];
    nuevosRepuestos[index].cantidad = nuevaCantidad;
    nuevosRepuestos[index].subtotal =
      nuevosRepuestos[index].cantidad * nuevosRepuestos[index].precioVenta;
    nuevosRepuestos[index].utilidad =
      nuevosRepuestos[index].subtotal -
      nuevosRepuestos[index].cantidad * nuevosRepuestos[index].precioCompra;
    setRepuestosOrden(nuevosRepuestos);
  };

  const removerRepuesto = (index: number) => {
    setRepuestosOrden(repuestosOrden.filter((_, i) => i !== index));
    toast.success("Repuesto removido");
  };

  const calcularTotalRepuestos = () => {
    return repuestosOrden.reduce((sum, r) => sum + r.subtotal, 0);
  };

  const onSubmit = async (data: EditOrdenForm) => {
    setSaving(true);
    try {
      const updateData: any = {
        descripcion: data.descripcion,
        servicios: serviciosOrden.map((s) => ({
          id: s.id,
          descripcion: s.descripcion,
          precio: s.precio,
          isNew: s.isNew || false,
        })),
      };

      if (canEdit) {
        updateData.mecanicoId = data.mecanicoId;
        updateData.manoDeObra = parseFloat(data.manoDeObra) || 0;
      }

      // ✅ ENVIAR PRODUCTOS NUEVOS
      const productosNuevos = productosOrden.filter((p) => p.isNew);
      if (productosNuevos.length > 0) {
        updateData.productosNuevos = productosNuevos.map((p) => ({
          productoId: p.productoId || p.id,
          cantidad: p.cantidad,
          precioUnitario: p.precioVenta,
        }));
      }

      // ✅ ENVIAR CAMBIOS EN PRODUCTOS EXISTENTES (precio y cantidad)
      const productosExistentes = productosOrden.filter((p) => !p.isNew);
      if (productosExistentes.length > 0) {
        updateData.productosActualizados = productosExistentes.map((p) => ({
          detalleId: p.id,
          cantidad: p.cantidad,
          precioUnitario: p.precioVenta,
        }));
      }

      // ✅ ENVIAR REPUESTOS NUEVOS
      const repuestosNuevos = repuestosOrden.filter((r) => r.isNew);
      if (repuestosNuevos.length > 0) {
        updateData.repuestosNuevos = repuestosNuevos.map((r) => ({
          nombre: r.nombre,
          descripcion: r.descripcion,
          cantidad: r.cantidad,
          precioCompra: r.precioCompra,
          precioVenta: r.precioVenta,
          subtotal: r.subtotal,
          utilidad: r.utilidad,
          proveedor: r.proveedor,
        }));
      }

      // ✅ ENVIAR CAMBIOS EN REPUESTOS EXISTENTES (precio y cantidad)
      const repuestosExistentes = repuestosOrden.filter((r) => !r.isNew);
      if (repuestosExistentes.length > 0) {
        updateData.repuestosActualizados = repuestosExistentes.map((r) => ({
          repuestoId: r.id,
          cantidad: r.cantidad,
          precioVenta: r.precioVenta,
          precioCompra: r.precioCompra,
        }));
      }

      console.log("📤 Enviando datos de actualización:", updateData);

      const response = await fetch(`/api/ordenes/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success("Orden actualizada exitosamente");
        router.push(`/ordenes/${params.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar orden");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar orden");
    } finally {
      setSaving(false);
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
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Orden no encontrada
        </h2>
        <Link href="/ordenes">
          <Button>Volver a Órdenes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/ordenes/${orden.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar {orden.numeroOrden}
            </h1>
            <p className="text-gray-600">
              {isMecanico
                ? "Actualizar servicios de la orden"
                : "Modificar información de la orden"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información de la Orden */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Trabajo *
              </label>
              <textarea
                {...register("descripcion", {
                  required: "La descripción es requerida",
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.descripcion && (
                <p className="text-sm text-red-600">
                  {errors.descripcion.message}
                </p>
              )}
            </div>

            {canEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mecánico Asignado *
                  </label>
                  <select
                    {...register("mecanicoId", {
                      required: "Selecciona un mecánico",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar mecánico</option>
                    {mecanicos.map((mecanico) => (
                      <option key={mecanico.id} value={mecanico.id}>
                        {mecanico.name}
                      </option>
                    ))}
                  </select>
                  {errors.mecanicoId && (
                    <p className="text-sm text-red-600">
                      {errors.mecanicoId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mano de Obra (Opcional)
                  </label>
                  <Input
                    {...register("manoDeObra")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Costo adicional por mano de obra especializada
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Servicios */}
        {canEditServicios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-green-600" />
                <span>Servicios</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Servicios disponibles para agregar */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Agregar Servicios:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {serviciosDisponibles.map((servicio) => (
                    <div
                      key={servicio.clave}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {servicio.descripcion}
                        </div>
                        {!servicio.requiereLubricacion && (
                          <div className="text-sm text-gray-500">
                            ${parseFloat(servicio.valor).toLocaleString()}
                          </div>
                        )}
                        {servicio.requiereLubricacion && (
                          <div className="text-xs text-blue-600 mt-1">
                            Precio según productos seleccionados
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => agregarServicio(servicio)}
                        className="bg-green-600 hover:bg-green-700 ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Servicios en la orden */}
              {serviciosOrden.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Servicios en esta Orden ({serviciosOrden.length}):
                  </h4>
                  <div className="space-y-3">
                    {serviciosOrden.map((servicio, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          servicio.isNew
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2">
                              {servicio.descripcion}
                              {servicio.isNew && (
                                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-sm text-gray-600 block mb-1">
                                  Precio para esta orden:
                                </label>
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={servicio.precio}
                                    onChange={(e) =>
                                      actualizarPrecioServicio(
                                        index,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-40 h-9 text-base font-semibold"
                                  />
                                  <span className="text-base font-bold text-green-600">
                                    ${servicio.precio.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  💡 Este precio solo aplica para esta orden
                                  específica
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => removerServicio(index)}
                            className="text-red-600 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total de Servicios */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">
                        Total Servicios:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ${calcularTotalServicios().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Productos del Inventario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Productos del Inventario</span>
              </div>
              {canEdit && (
                <Button
                  type="button"
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
          <CardContent className="space-y-4">
            {productosOrden.length > 0 ? (
              <div className="space-y-3">
                {productosOrden.map((producto, index) => (
                  <div
                    key={producto.id}
                    className="bg-white border-2 border-blue-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Código: {producto.codigo} | Cantidad:{" "}
                          {producto.cantidad}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerProducto(index)}
                          className="text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Cantidad
                        </label>
                        <Input
                          type="number"
                          min={1}
                          className="h-9 text-sm"
                          value={producto.cantidad}
                          onChange={(e) =>
                            actualizarCantidadProducto(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Precio Unit.
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-9 text-sm pl-6"
                            value={producto.precioVenta}
                            onChange={(e) =>
                              actualizarPrecioProducto(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Subtotal
                        </label>
                        <div className="h-9 flex items-center px-3 bg-blue-50 rounded-md border-2 border-blue-200">
                          <span className="font-bold text-blue-600 text-sm">
                            ${producto.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                      Total Productos:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ${calcularTotalProductos().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                <p>No hay productos agregados aún.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repuestos Externos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                <span>Repuestos Externos</span>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowRepuestoExternoModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Repuesto
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {repuestosOrden.length > 0 ? (
              <div className="space-y-3">
                {repuestosOrden.map((repuesto, index) => (
                  <div
                    key={repuesto.id}
                    className="bg-white border-2 border-orange-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                          {repuesto.nombre}
                        </div>
                        {repuesto.descripcion && (
                          <div className="text-xs text-gray-500 mt-1 break-words">
                            {repuesto.descripcion}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          Proveedor: {repuesto.proveedor || "N/A"}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerRepuesto(index)}
                          className="text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Cantidad editable */}
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Cantidad
                        </label>
                        <Input
                          type="number"
                          min={1}
                          className="h-9 text-sm"
                          value={repuesto.cantidad}
                          onChange={(e) =>
                            actualizarCantidadRepuesto(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>

                      {/* Precio Compra (solo lectura) */}
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          P. Compra
                        </label>
                        <div className="h-9 flex items-center px-3 bg-gray-50 rounded-md border">
                          <span className="text-sm">
                            ${repuesto.precioCompra.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Precio Venta editable */}
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          P. Venta
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-9 text-sm pl-6"
                            value={repuesto.precioVenta}
                            onChange={(e) =>
                              actualizarPrecioRepuesto(
                                index,
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Subtotal calculado */}
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">
                          Subtotal
                        </label>
                        <div className="h-9 flex items-center px-3 bg-orange-50 rounded-md border-2 border-orange-200">
                          <span className="font-bold text-orange-600 text-sm">
                            ${repuesto.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Utilidad */}
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Utilidad:</span>
                        <span className="font-semibold text-green-600 text-sm">
                          ${repuesto.utilidad.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                      Total Repuestos:
                    </span>
                    <span className="text-xl font-bold text-orange-600">
                      ${calcularTotalRepuestos().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                <p>No hay repuestos externos agregados aún.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <Link href={`/ordenes/${orden.id}`}>
            <Button variant="outline" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>

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
        onAdd={agregarRepuestoExterno}
      />
    </div>
  );
}
// Componente Modal para Repuesto Externo
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
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Repuesto Externo">
      <form onSubmit={handleSubmit} className="space-y-4">
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
              step="0.01"
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
              step="0.01"
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

        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Utilidad:</span>
            <span className="font-bold text-green-600">
              ${calcularUtilidad().toLocaleString()}
            </span>
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
    </Modal>
  );
}
