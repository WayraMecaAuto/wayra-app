"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Plus,
  Search,
  Trash2,
  Car,
  User,
  Calendar,
  DollarSign,
  Wrench,
  FileText,
  Package,
  Calculator,
  Save,
  Camera,
  Scan,
  ShoppingCart,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { Modal } from "@/components/ui/modal";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { VehiculoForm } from "@/components/forms/VehiculoForm";
import { LubricacionModal } from "@/components/forms/LubricacionModal";
import  {ProductSelectorModal } from "@/components/forms/ProductSelectorModal";
import Dropdown from "@/components/forms/Dropdown";
import toast from "react-hot-toast";

interface OrdenForm {
  clienteId: string;
  vehiculoId: string;
  descripcion: string;
  mecanicoId: string;
  manoDeObra: string;
}

interface Servicio {
  clave: string;
  descripcion: string;
  precio: number;
  requiereLubricacion?: boolean;
}

interface ProductoOrden {
  id: string;
  nombre: string;
  codigo: string;
  cantidad: number;
  precio: number;
  tipoPrecio: "VENTA" | "MINORISTA" | "MAYORISTA";
  subtotal: number;
  stock: number;
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
}

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
}

interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año?: number;
  clienteId: string;
}

interface ServicioConLubricacion extends Servicio {
  aceiteId?: string;
  filtroId?: string;
  aceiteNombre?: string;
  filtroNombre?: string;
}

export default function NuevaOrdenPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>(
    []
  );
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    ServicioConLubricacion[]
  >([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState<
    ProductoOrden[]
  >([]);
  const [repuestosExternos, setRepuestosExternos] = useState<RepuestoExterno[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showVehiculoModal, setShowVehiculoModal] = useState(false);
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  const [showLubricacionModal, setShowLubricacionModal] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [servicioLubricacionTemp, setServicioLubricacionTemp] =
    useState<Servicio | null>(null);

  const opcionesTipoPrecio = [
    { value: "VENTA", label: "Precio Venta" },
    { value: "MINORISTA", label: "Precio Minorista" },
    { value: "MAYORISTA", label: "Precio Mayorista" },
  ];
  // Verificar permisos
  const hasAccess = ["SUPER_USUARIO", "ADMIN_WAYRA_TALLER"].includes(
    session?.user?.role || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrdenForm>({
    defaultValues: {
      manoDeObra: "0",
    },
  });
  const selectedClienteId = watch("clienteId");
  const manoDeObra = parseFloat(watch("manoDeObra") || "0");

  useEffect(() => {
    if (hasAccess) {
      fetchClientes();
      fetchMecanicos();
      fetchServicios();
    }
  }, [hasAccess]);

  useEffect(() => {
    if (selectedClienteId) {
      fetchVehiculos(selectedClienteId);
    } else {
      setVehiculos([]);
      setValue("vehiculoId", "");
    }
  }, [selectedClienteId]);

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchVehiculos = async (clienteId: string) => {
    try {
      const response = await fetch(`/api/vehiculos?clienteId=${clienteId}`);
      if (response.ok) {
        const data = await response.json();
        setVehiculos(data);
      }
    } catch (error) {
      console.error("Error fetching vehiculos:", error);
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

  const handleClienteCreated = (cliente: Cliente) => {
    setClientes([...clientes, cliente]);
    setValue("clienteId", cliente.id);
  };

  const handleVehiculoCreated = (vehiculo: Vehiculo) => {
    setVehiculos([...vehiculos, vehiculo]);
    setValue("vehiculoId", vehiculo.id);
  };

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await fetch(
        `/api/productos/barcode/${encodeURIComponent(code)}`
      );
      if (response.ok) {
        const product = await response.json();
        const exists = productosSeleccionados.find((p) => p.id === product.id);
        if (exists) {
          toast.error("Este producto ya está agregado a la orden");
          return;
        }
        const nuevoProducto: ProductoOrden = {
          id: product.id,
          nombre: product.nombre,
          codigo: product.codigo,
          cantidad: 1,
          precio: product.precioVenta,
          tipoPrecio: "VENTA",
          subtotal: product.precioVenta,
          stock: product.stock,
        };
        setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
        toast.success(`Producto agregado: ${product.nombre}`);
      } else {
        toast.error("Producto no encontrado");
      }
    } catch (error) {
      toast.error("Error al buscar producto");
    }
    setShowScanner(false);
  };

  const handleProductSelected = async (producto: any, tipoPrecio: string) => {
    // Verificar si ya está agregado
    const exists = productosSeleccionados.find((p) => p.id === producto.id);
    if (exists) {
      toast.error("Este producto ya está agregado a la orden");
      return;
    }

    // Determinar el precio según el tipo seleccionado
    let precio = producto.precioVenta;
    switch (tipoPrecio) {
      case "MINORISTA":
        precio = producto.precioMinorista;
        break;
      case "MAYORISTA":
        precio = producto.precioMayorista;
        break;
      case "VENTA":
      default:
        precio = producto.precioVenta;
        break;
    }

    const nuevoProducto: ProductoOrden = {
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      cantidad: 1,
      precio: precio,
      tipoPrecio: tipoPrecio as "VENTA" | "MINORISTA" | "MAYORISTA",
      subtotal: precio,
      stock: producto.stock,
    };

    setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    toast.success(`${producto.nombre} agregado con precio ${tipoPrecio}`);
  };

  const agregarServicio = (servicio: Servicio) => {
    if (servicio.requiereLubricacion) {
      setServicioLubricacionTemp(servicio);
      setShowLubricacionModal(true);
    } else {
      const existe = serviciosSeleccionados.find(
        (s) => s.clave === servicio.clave
      );
      if (!existe) {
        setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
        toast.success("Servicio agregado");
      }
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
      console.log("🔧 Procesando lubricación en nueva orden:", data);

      // 1. Agregar productos del inventario a la lista de productos
      data.productosInventario.forEach((prod) => {
        const exists = productosSeleccionados.find((p) => p.id === prod.id);
        if (!exists) {
          const nuevoProducto: ProductoOrden = {
            id: prod.id,
            nombre: prod.nombre,
            codigo: "", // Se obtendrá del inventario
            cantidad: prod.cantidad,
            precio: prod.precio,
            tipoPrecio: prod.tipoPrecio as "VENTA" | "MINORISTA" | "MAYORISTA",
            subtotal: prod.precio * prod.cantidad,
            stock: 999, // Temporal, se verificará en backend
          };
          setProductosSeleccionados((prev) => [...prev, nuevoProducto]);
        }
      });

      // 2. Agregar repuestos externos a la lista
      data.repuestosExternos.forEach((rep) => {
        const nuevoRepuesto: RepuestoExterno = {
          id: Date.now().toString() + Math.random(),
          nombre: rep.nombre,
          descripcion: rep.descripcion,
          cantidad: rep.cantidad,
          precioCompra: rep.precioCompra,
          precioVenta: rep.precioVenta,
          subtotal: rep.precioVenta * rep.cantidad,
          utilidad: (rep.precioVenta - rep.precioCompra) * rep.cantidad,
          proveedor: rep.proveedor,
        };
        setRepuestosExternos((prev) => [...prev, nuevoRepuesto]);
      });

      // 3. Agregar servicio de mano de obra si es mayor a 0
      if (data.precioManoObra > 0) {
        // Buscar el servicio de lubricación en los disponibles
        const servicioLubricacion = serviciosDisponibles.find(
          (s) => s.clave === "SERVICIO_LUBRICACION"
        );

        if (servicioLubricacion) {
          const nuevoServicio = {
            clave: servicioLubricacion.clave,
            descripcion: "Mano de Obra - Lubricación",
            precio: data.precioManoObra,
          };
          setServiciosSeleccionados((prev) => [...prev, nuevoServicio]);
        }
      }

      toast.success(
        <div>
          <div className="font-semibold">✅ Lubricación agregada</div>
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
        { duration: 5000 }
      );
    } catch (error) {
      console.error("❌ Error al procesar lubricación:", error);
      toast.error("Error al agregar lubricación");
    }
  };

  const removerServicio = (servicioId: string) => {
    setServiciosSeleccionados(
      serviciosSeleccionados.filter((s) => s.clave !== servicioId)
    );
    toast.success("Servicio removido");
  };

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const nuevosProductos = [...productosSeleccionados];
    nuevosProductos[index] = { ...nuevosProductos[index], [campo]: valor };
    if (campo === "cantidad" || campo === "precio") {
      nuevosProductos[index].subtotal =
        nuevosProductos[index].cantidad * nuevosProductos[index].precio;
    }
    setProductosSeleccionados(nuevosProductos);
  };

  const removerProducto = (index: number) => {
    setProductosSeleccionados(
      productosSeleccionados.filter((_, i) => i !== index)
    );
  };

  const agregarRepuestoExterno = (repuesto: RepuestoExterno) => {
    setRepuestosExternos([
      ...repuestosExternos,
      { ...repuesto, id: Date.now().toString() },
    ]);
  };

  const removerRepuestoExterno = (index: number) => {
    setRepuestosExternos(repuestosExternos.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const totalServicios = serviciosSeleccionados.reduce(
      (sum, s) => sum + s.precio,
      0
    );
    const totalProductos = productosSeleccionados.reduce(
      (sum, p) => sum + p.subtotal,
      0
    );
    const totalRepuestosExternos = repuestosExternos.reduce(
      (sum, r) => sum + r.subtotal,
      0
    );
    const subtotal =
      totalServicios + totalProductos + totalRepuestosExternos + manoDeObra;
    const total = subtotal;
    const utilidadRepuestos = repuestosExternos.reduce(
      (sum, r) => sum + r.utilidad,
      0
    );
    return {
      totalServicios,
      totalProductos,
      totalRepuestosExternos,
      manoDeObra,
      subtotal,
      total,
      utilidadRepuestos,
    };
  };

  const onSubmit = async (data: OrdenForm) => {
    if (
      serviciosSeleccionados.length === 0 &&
      productosSeleccionados.length === 0 &&
      repuestosExternos.length === 0
    ) {
      toast.error(
        "Debe agregar al menos un servicio, producto o repuesto externo"
      );
      return;
    }

    setLoading(true);
    try {
      // 🔥 Extraer productos de lubricación de los servicios
      const serviciosParaEnviar = serviciosSeleccionados.map((servicio) => {
        // Si es lubricación, agregar metadata de productos
        if (
          servicio.descripcion.includes("Lubricación") ||
          servicio.descripcion.includes("lubricación")
        ) {
          return {
            ...servicio,
            // Los productos se descontarán automáticamente en el backend cuando se complete la orden
          };
        }
        return servicio;
      });

      const response = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          manoDeObra: parseFloat(data.manoDeObra) || 0,
          servicios: serviciosParaEnviar,
          productos: productosSeleccionados,
          repuestosExternos,
        }),
      });

      if (response.ok) {
        toast.success("Orden creada exitosamente");
        window.location.href = "/ordenes";
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al crear orden");
      }
    } catch (error) {
      toast.error("Error al crear orden");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    redirect("/ordenes");
  }

  const totales = calcularTotales();

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 sm:p-8 text-white shadow-lg animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 gap-4">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Plus className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              Nueva Orden de Trabajo
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              Crear nueva orden de servicio completa
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Cliente y Vehículo */}
          <Card className="shadow-lg border-0 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                <span>Cliente y Vehículo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* 1. CLIENTE */}
              <div className="flex gap-2">
                <Dropdown
                  options={clientes.map((c) => ({
                    value: c.id,
                    label: c.nombre,
                  }))}
                  value={selectedClienteId}
                  onChange={(val) => setValue("clienteId", val)}
                  placeholder="Seleccionar cliente"
                  icon={<User className="h-4 w-4 text-gray-500" />}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => setShowClienteModal(true)}
                  className="h-11 w-11 p-0 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {errors.clienteId && (
                <p className="text-sm text-red-600">
                  {errors.clienteId.message}
                </p>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {/* 2. VEHÍCULO */}
                <div className="flex gap-2">
                  <Dropdown
                    options={vehiculos.map((v) => ({
                      value: v.id,
                      label: `${v.marca} ${v.modelo} - ${v.placa}`,
                    }))}
                    value={watch("vehiculoId")}
                    onChange={(val) => setValue("vehiculoId", val)}
                    placeholder="Seleccionar vehículo"
                    icon={<Car className="h-4 w-4 text-gray-500" />}
                    className="flex-1"
                    disabled={!selectedClienteId}
                  />
                  <Button
                    type="button"
                    onClick={() => setShowVehiculoModal(true)}
                    disabled={!selectedClienteId}
                    className="h-11 w-11 p-0 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {errors.vehiculoId && (
                <p className="text-sm text-red-600">
                  {errors.vehiculoId.message}
                </p>
              )}

              <div className="relative">
                {/* 3. MECÁNICO */}
                <Dropdown
                  options={mecanicos.map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                  value={watch("mecanicoId")}
                  onChange={(val) => setValue("mecanicoId", val)}
                  placeholder="Seleccionar mecánico"
                  icon={<Wrench className="h-4 w-4 text-gray-500" />}
                />
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    {...register("manoDeObra")}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8 text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <textarea
                  {...register("descripcion", {
                    required: "La descripción es requerida",
                  })}
                  rows={3}
                  placeholder="Describe el trabajo a realizar..."
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none"
                />
                {errors.descripcion && (
                  <p className="text-sm text-red-600">
                    {errors.descripcion.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card className="shadow-lg border-0 animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Wrench className="h-5 w-5" />
                <span>Servicios del Taller</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="max-h-64 overflow-y-auto">
                {serviciosDisponibles.map((servicio) => (
                  <div
                    key={servicio.clave}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-gray-900 whitespace-normal break-words">
                        {servicio.descripcion}
                      </div>
                      {!servicio.requiereLubricacion && (
                        <div className="text-sm text-gray-500">
                          ${servicio.precio.toLocaleString()}
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
                      disabled={serviciosSeleccionados.some(
                        (s) => s.clave === servicio.clave
                      )}
                      className="bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Servicios Seleccionados */}
              {serviciosSeleccionados.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3 text-base sm:text-lg">
                    Servicios Seleccionados:
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {serviciosSeleccionados.map((servicio, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-200 transition-all duration-200 min-w-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-green-800 whitespace-normal break-words">
                            {servicio.descripcion}
                          </div>
                          <div className="space-y-1 mt-2">
                            <label className="text-xs text-gray-600">
                              Precio para esta orden:
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={servicio.precio}
                                onChange={(e) => {
                                  const nuevosServicios = [
                                    ...serviciosSeleccionados,
                                  ];
                                  nuevosServicios[index].precio =
                                    parseFloat(e.target.value) || 0;
                                  setServiciosSeleccionados(nuevosServicios);
                                }}
                                className="w-32 h-8 text-sm font-semibold border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              />
                              <span className="text-sm font-bold text-green-700">
                                ${servicio.precio.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              💡 Este precio solo aplica para esta orden
                            </p>
                          </div>
                          {servicio.aceiteId && servicio.filtroId && (
                            <div className="text-xs text-green-600 space-y-0.5 mt-2">
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span className="whitespace-normal break-words">
                                  Aceite: {servicio.aceiteNombre}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span className="whitespace-normal break-words">
                                  Filtro: {servicio.filtroNombre}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerServicio(servicio.clave)}
                          className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productos del Inventario */}
        <Card className="shadow-lg border-0 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Productos del Inventario</span>
              </div>
              <div className="flex space-x-2">
                {/* BOTÓN NUEVO: Seleccionar Productos */}
                <Button
                  type="button"
                  onClick={() => setShowProductSelector(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-white/30 hover:scale-105 transition-transform"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Seleccionar Productos
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:scale-105 transition-transform"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Escanear Producto
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {productosSeleccionados.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="hidden lg:block">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 min-w-0">
                          Producto
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                          Stock
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                          Cantidad
                        </th>

                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          Precio Unit.
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          Subtotal
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosSeleccionados.map((producto, index) => (
                        <tr
                          key={producto.id}
                          className="border-b border-gray-100"
                        >
                          <td className="py-3 px-3 min-w-0">
                            <div className="whitespace-normal break-words">
                              <div className="font-medium text-sm sm:text-base text-gray-900">
                                {producto.nombre}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                {producto.codigo}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-medium ${producto.stock <= 5 ? "text-red-600 animate-pulse" : "text-gray-900"}`}
                            >
                              {producto.stock}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="number"
                              min="1"
                              max={producto.stock}
                              value={producto.cantidad}
                              onChange={(e) =>
                                actualizarProducto(
                                  index,
                                  "cantidad",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 h-8 text-center text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={producto.precio}
                                onChange={(e) => {
                                  const nuevoPrecio =
                                    parseFloat(e.target.value) || 0;
                                  const nuevosProductos = [
                                    ...productosSeleccionados,
                                  ];
                                  nuevosProductos[index].precio = nuevoPrecio;
                                  nuevosProductos[index].subtotal =
                                    nuevosProductos[index].cantidad *
                                    nuevoPrecio;
                                  setProductosSeleccionados(nuevosProductos);
                                }}
                                className="w-24 h-8 text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 font-bold text-green-600 text-sm sm:text-base">
                            ${producto.subtotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removerProducto(index)}
                              className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-4">
                  {productosSeleccionados.map((producto, index) => (
                    <div
                      key={producto.id}
                      className="border-b border-gray-100 pb-4 flex flex-col gap-2 min-w-0"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm sm:text-base text-gray-900 whitespace-normal break-words">
                          {producto.nombre}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {producto.codigo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm sm:text-base">
                          <span className="font-medium">Stock: </span>
                          <span
                            className={`${producto.stock <= 5 ? "text-red-600 animate-pulse" : "text-gray-900"}`}
                          >
                            {producto.stock}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base">
                          <span className="font-medium">Cantidad: </span>
                          <Input
                            type="number"
                            min="1"
                            max={producto.stock}
                            value={producto.cantidad}
                            onChange={(e) =>
                              actualizarProducto(
                                index,
                                "cantidad",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 h-8 inline-block text-center text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div className="text-sm sm:text-base text-right">
                          <div>
                            <span className="font-medium">Precio Unit.: </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={producto.precio}
                              onChange={(e) => {
                                const nuevoPrecio =
                                  parseFloat(e.target.value) || 0;
                                const nuevosProductos = [
                                  ...productosSeleccionados,
                                ];
                                nuevosProductos[index].precio = nuevoPrecio;
                                nuevosProductos[index].subtotal =
                                  nuevosProductos[index].cantidad * nuevoPrecio;
                                setProductosSeleccionados(nuevosProductos);
                              }}
                              className="w-24 h-8 inline-block text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <span className="font-medium">Subtotal: </span>
                            <span className="font-bold text-green-600">
                              ${producto.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerProducto(index)}
                          className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">
                  No hay productos agregados
                </p>
                <p className="text-xs sm:text-sm">
                  Escanea códigos de barras para agregar productos
                </p>
              </div>
            )}
          </CardContent>
          <ProductSelectorModal
            isOpen={showProductSelector}
            onClose={() => setShowProductSelector(false)}
            onSelect={handleProductSelected}
          />
        </Card>

        {/* Repuestos Externos */}
        <Card className="shadow-lg border-0 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Repuestos Externos</span>
              </div>
              <Button
                type="button"
                onClick={() => setShowRepuestoModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:scale-105 transition-transform"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Repuesto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {repuestosExternos.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
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
                          P. Compra
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          P. Venta
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          Utilidad
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-28">
                          Subtotal
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 w-20">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {repuestosExternos.map((repuesto, index) => (
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
                          <td className="py-3 px-3 text-sm sm:text-base text-gray-600">
                            ${repuesto.precioCompra.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={repuesto.precioVenta}
                                onChange={(e) => {
                                  const nuevoPrecio =
                                    parseFloat(e.target.value) || 0;
                                  const nuevosRepuestos = [
                                    ...repuestosExternos,
                                  ];
                                  nuevosRepuestos[index].precioVenta =
                                    nuevoPrecio;
                                  nuevosRepuestos[index].subtotal =
                                    nuevosRepuestos[index].cantidad *
                                    nuevoPrecio;
                                  nuevosRepuestos[index].utilidad =
                                    nuevosRepuestos[index].subtotal -
                                    nuevosRepuestos[index].cantidad *
                                      nuevosRepuestos[index].precioCompra;
                                  setRepuestosExternos(nuevosRepuestos);
                                }}
                                className="w-24 h-8 text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500 transition-all duration-200"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 font-medium text-green-600 text-sm sm:text-base">
                            ${repuesto.utilidad.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-orange-600 text-sm sm:text-base">
                            ${repuesto.subtotal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removerRepuestoExterno(index)}
                              className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-4">
                  {repuestosExternos.map((repuesto, index) => (
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
                            <span className="font-medium">P. Compra: </span>$
                            {repuesto.precioCompra.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">P. Venta: </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={repuesto.precioVenta}
                              onChange={(e) => {
                                const nuevoPrecio =
                                  parseFloat(e.target.value) || 0;
                                const nuevosRepuestos = [...repuestosExternos];
                                nuevosRepuestos[index].precioVenta =
                                  nuevoPrecio;
                                nuevosRepuestos[index].subtotal =
                                  nuevosRepuestos[index].cantidad * nuevoPrecio;
                                nuevosRepuestos[index].utilidad =
                                  nuevosRepuestos[index].subtotal -
                                  nuevosRepuestos[index].cantidad *
                                    nuevosRepuestos[index].precioCompra;
                                setRepuestosExternos(nuevosRepuestos);
                              }}
                              className="w-24 h-8 inline-block text-sm border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <span className="font-medium">Utilidad: </span>
                            <span className="text-green-600">
                              ${repuesto.utilidad.toLocaleString()}
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
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removerRepuestoExterno(index)}
                          className="text-red-600 hover:bg-red-50 hover:scale-105 transition-transform"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">
                  No hay repuestos externos agregados
                </p>
                <p className="text-xs sm:text-sm">
                  Agrega repuestos que no están en el inventario
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen y Total */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-blue-50 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-gray-800">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Resumen de la Orden</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Servicios</div>
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  ${totales.totalServicios.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Productos</div>
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  ${totales.totalProductos.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Repuestos Ext.</div>
                <div className="text-lg sm:text-xl font-bold text-orange-600">
                  ${totales.totalRepuestosExternos.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Mano de Obra</div>
                <div className="text-lg sm:text-xl font-bold text-indigo-600">
                  ${totales.manoDeObra.toLocaleString()}
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  ${totales.total.toLocaleString()}
                </div>
              </div>
            </div>
            {totales.utilidadRepuestos > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-700 font-medium">
                    Utilidad Repuestos Externos:
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-green-600">
                    ${totales.utilidadRepuestos.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={loading}
            className="px-6 py-2 text-sm sm:text-base border-gray-200 shadow-sm hover:scale-105 transition-transform"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:scale-105 transition-transform"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? "Creando..." : "Crear Orden"}
          </Button>
        </div>
      </form>

      {/* Modals */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Escanear Producto para Orden"
      />
      <ClienteForm
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSuccess={handleClienteCreated}
      />
      {selectedClienteId && (
        <VehiculoForm
          isOpen={showVehiculoModal}
          onClose={() => setShowVehiculoModal(false)}
          onSuccess={handleVehiculoCreated}
          clienteId={selectedClienteId}
        />
      )}
      <RepuestoExternoModal
        isOpen={showRepuestoModal}
        onClose={() => setShowRepuestoModal(false)}
        onAdd={agregarRepuestoExterno}
      />
      <LubricacionModal
        isOpen={showLubricacionModal}
        onClose={() => {
          setShowLubricacionModal(false);
          setServicioLubricacionTemp(null);
        }}
        onAdd={handleLubricacionAdded}
      />
    </div>
  );
}

// Componente para modal de repuesto externo
function RepuestoExternoModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (repuesto: RepuestoExterno) => void;
}) {
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
    if (
      !formData.nombre ||
      formData.precioCompra <= 0 ||
      formData.precioVenta <= 0
    ) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    if (formData.precioVenta < formData.precioCompra) {
      toast.error("El precio de venta debe ser mayor al precio de compra");
      return;
    }
    const utilidad = calcularUtilidad();
    const repuesto: RepuestoExterno = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      cantidad: formData.cantidad,
      precioCompra: formData.precioCompra,
      precioVenta: formData.precioVenta,
      subtotal: formData.cantidad * formData.precioVenta,
      utilidad: utilidad,
      proveedor: formData.proveedor,
    };
    onAdd(repuesto);
    setFormData({
      nombre: "",
      descripcion: "",
      cantidad: 1,
      precioCompra: 0,
      precioVenta: 0,
      proveedor: "",
    });
    onClose();
    toast.success("Repuesto externo agregado");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Repuesto Externo"
      className="animate-fade-in"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Repuesto *
          </label>
          <Input
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            placeholder="Ej: Pastillas de freno Toyota"
            className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <Input
            value={formData.descripcion}
            onChange={(e) =>
              setFormData({ ...formData, descripcion: e.target.value })
            }
            placeholder="Descripción adicional"
            className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proveedor
          </label>
          <Input
            value={formData.proveedor}
            onChange={(e) =>
              setFormData({ ...formData, proveedor: e.target.value })
            }
            placeholder="Nombre del proveedor"
            className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cantidad: parseInt(e.target.value) || 1,
                })
              }
              className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Compra *
            </label>
            <Input
              type="number"
              step="100"
              min="0"
              value={formData.precioCompra}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  precioCompra: parseFloat(e.target.value) || 0,
                })
              }
              className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Venta *
            </label>
            <Input
              type="number"
              step="100"
              min="0"
              value={formData.precioVenta}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  precioVenta: parseFloat(e.target.value) || 0,
                })
              }
              className="text-sm sm:text-base border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              required
            />
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">Total Compra:</span>
            <span className="font-medium text-gray-800">
              ${(formData.cantidad * formData.precioCompra).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm sm:text-base">
            <span className="text-gray-600">Total Venta:</span>
            <span className="font-medium text-orange-600">
              ${(formData.cantidad * formData.precioVenta).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center border-t pt-2 text-sm sm:text-base">
            <span className="font-medium text-gray-700">Utilidad:</span>
            <span className="font-bold text-green-600">
              ${calcularUtilidad().toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 text-sm sm:text-base border-gray-200 shadow-sm hover:scale-105 transition-transform"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-6 py-2 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-transform"
          >
            Agregar Repuesto
          </Button>
        </div>
      </form>
    </Modal>
  );
}