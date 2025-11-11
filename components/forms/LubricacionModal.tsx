import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Droplets,
  Filter,
  Package,
  AlertCircle,
  CheckCircle2,
  Box,
  ShoppingCart,
  Plus,
  X,
  DollarSign,
  PackagePlus,
} from "lucide-react";
import toast from "react-hot-toast";

interface LubricacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
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
  }) => void;
}

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  stock: number;
  precioVenta: number;
  precioMinorista: number;
  precioCompra: number;
  monedaCompra: string;
  tipo?: string;
  categoria?: string;
}

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  codigo: string;
  precioVenta: number;
  precioMinorista: number;
  precioCompra: number;
  monedaCompra: string;
  tipo: "ACEITE" | "FILTRO";
  inventarioTipo?: string;
  cantidad: number;
}

interface ProductoExterno {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: "ACEITE" | "FILTRO";
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  proveedor: string;
}

export function LubricacionModal({
  isOpen,
  onClose,
  onAdd,
}: LubricacionModalProps) {
  const [aceites, setAceites] = useState<Producto[]>([]);
  const [filtros, setFiltros] = useState<Producto[]>([]);
  const [productosInventario, setProductosInventario] = useState<ProductoSeleccionado[]>([]);
  const [productosExternos, setProductosExternos] = useState<ProductoExterno[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAceite, setSearchAceite] = useState("");
  const [searchFiltro, setSearchFiltro] = useState("");
  const [precioServicioTotal, setPrecioServicioTotal] = useState<string>("");
  const [showExternoForm, setShowExternoForm] = useState(false);
  const [tipoExternoForm, setTipoExternoForm] = useState<"ACEITE" | "FILTRO">("ACEITE");

  // Form externo
  const [nombreExterno, setNombreExterno] = useState("");
  const [descripcionExterno, setDescripcionExterno] = useState("");
  const [cantidadExterno, setCantidadExterno] = useState("1");
  const [precioCompraExterno, setPrecioCompraExterno] = useState("");
  const [precioVentaExterno, setPrecioVentaExterno] = useState("");
  const [proveedorExterno, setProveedorExterno] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchProductos();
    }
  }, [isOpen]);

  const resetForm = () => {
    setProductosInventario([]);
    setProductosExternos([]);
    setSearchAceite("");
    setSearchFiltro("");
    setPrecioServicioTotal("");
    setShowExternoForm(false);
    resetExternoForm();
  };

  const resetExternoForm = () => {
    setNombreExterno("");
    setDescripcionExterno("");
    setCantidadExterno("1");
    setPrecioCompraExterno("");
    setPrecioVentaExterno("");
    setProveedorExterno("");
  };

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const [wayraEniRes, wayraCalanRes, torniLubricantesRes, torniFiltrosRes] =
        await Promise.all([
          fetch("/api/productos?tipo=WAYRA_ENI")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("/api/productos?tipo=WAYRA_CALAN")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("/api/productos?tipo=TORNI_REPUESTO&categoria=LUBRICANTES")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetch("/api/productos?tipo=TORNI_REPUESTO&categoria=FILTROS")
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

      const wayraEniArray = Array.isArray(wayraEniRes) ? wayraEniRes : [];
      const wayraCalanArray = Array.isArray(wayraCalanRes) ? wayraCalanRes : [];
      const torniLubricantesArray = Array.isArray(torniLubricantesRes) ? torniLubricantesRes : [];
      const torniFiltrosArray = Array.isArray(torniFiltrosRes) ? torniFiltrosRes : [];

      const wayraEniProductos = wayraEniArray.map((p) => ({
        ...p,
        inventarioOrigen: "WAYRA_ENI",
      }));
      const wayraCalanProductos = wayraCalanArray.map((p) => ({
        ...p,
        inventarioOrigen: "WAYRA_CALAN",
      }));
      const torniLubricantes = torniLubricantesArray.map((p) => ({
        ...p,
        inventarioOrigen: "TORNI_REPUESTO",
      }));
      const torniFiltros = torniFiltrosArray.map((p) => ({
        ...p,
        inventarioOrigen: "TORNI_REPUESTO",
      }));

      const wayraLubricantes = [
        ...wayraEniProductos,
        ...wayraCalanProductos,
      ].filter((p) => {
        const nombre = (p.nombre || "").toLowerCase();
        const categoria = (p.categoria || "").toLowerCase();
        const descripcion = (p.descripcion || "").toLowerCase();
        const esFiltro =
          nombre.includes("filtro") ||
          categoria.includes("filtro") ||
          descripcion.includes("filtro");
        return !esFiltro && p.stock > 0;
      });

      const wayraFiltros = [
        ...wayraEniProductos,
        ...wayraCalanProductos,
      ].filter((p) => {
        const nombre = (p.nombre || "").toLowerCase();
        const categoria = (p.categoria || "").toLowerCase();
        const descripcion = (p.descripcion || "").toLowerCase();
        const texto = `${nombre} ${categoria} ${descripcion}`;
        const esFiltroAceite =
          texto.includes("filtro") &&
          (texto.includes("aceite") || texto.includes("oil"));
        return esFiltroAceite && p.stock > 0;
      });

      const torniFiltrosAceite = torniFiltros.filter((p) => {
        const nombre = (p.nombre || "").toLowerCase();
        const descripcion = (p.descripcion || "").toLowerCase();
        const texto = `${nombre} ${descripcion}`;
        const esFiltroAceite =
          texto.includes("aceite") ||
          texto.includes("oil") ||
          texto.includes("motor") ||
          (texto.includes("filtro") &&
            (texto.includes("aceite") || texto.includes("motor")));
        return esFiltroAceite && p.stock > 0;
      });

      const todosLosAceites = [
        ...wayraLubricantes,
        ...torniLubricantes.filter((p) => p.stock > 0),
      ];

      const todosLosFiltros = [...wayraFiltros, ...torniFiltrosAceite];

      setAceites(todosLosAceites);
      setFiltros(todosLosFiltros);

      if (todosLosAceites.length === 0 && todosLosFiltros.length === 0) {
        toast.error("No hay productos disponibles con stock");
      }
    } catch (error) {
      console.error("❌ Error al cargar productos:", error);
      toast.error("Error al cargar productos del inventario");
      setAceites([]);
      setFiltros([]);
    } finally {
      setLoading(false);
    }
  };

  const agregarProductoInventario = (producto: Producto, tipo: "ACEITE" | "FILTRO") => {
    if (productosInventario.some((p) => p.id === producto.id)) {
      toast.error("Este producto ya está agregado");
      return;
    }

    const productoConOrigen = producto as any;

    setProductosInventario((prev) => [
      ...prev,
      {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precioVenta: producto.precioVenta,
        precioMinorista: producto.precioMinorista,
        precioCompra: producto.precioCompra,
        monedaCompra: producto.monedaCompra || 'COP',
        tipo,
        inventarioTipo: productoConOrigen.inventarioOrigen || producto.tipo,
        cantidad: 1,
      },
    ]);
    toast.success(`✅ ${producto.nombre} agregado`);
  };

  const removerProductoInventario = (id: string) => {
    setProductosInventario((prev) => prev.filter((p) => p.id !== id));
  };

  const actualizarCantidadInventario = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setProductosInventario((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  const agregarProductoExterno = () => {
    if (!nombreExterno.trim()) {
      toast.error("Ingresa el nombre del producto");
      return;
    }

    if (!cantidadExterno || parseInt(cantidadExterno) < 1) {
      toast.error("Ingresa una cantidad válida");
      return;
    }

    if (!precioCompraExterno || parseFloat(precioCompraExterno) < 0) {
      toast.error("Ingresa el precio de compra");
      return;
    }

    if (!precioVentaExterno || parseFloat(precioVentaExterno) <= 0) {
      toast.error("Ingresa el precio de venta");
      return;
    }

    if (parseFloat(precioVentaExterno) < parseFloat(precioCompraExterno)) {
      toast.error("El precio de venta no puede ser menor al precio de compra");
      return;
    }

    const nuevoExterno: ProductoExterno = {
      id: Date.now().toString() + Math.random(),
      nombre: nombreExterno.trim(),
      descripcion: descripcionExterno.trim() || nombreExterno.trim(),
      tipo: tipoExternoForm,
      cantidad: parseInt(cantidadExterno),
      precioCompra: parseFloat(precioCompraExterno),
      precioVenta: parseFloat(precioVentaExterno),
      proveedor: proveedorExterno.trim() || "Sin especificar",
    };

    setProductosExternos((prev) => [...prev, nuevoExterno]);
    toast.success(`✅ ${tipoExternoForm === "ACEITE" ? "Aceite" : "Filtro"} externo agregado`);
    resetExternoForm();
    setShowExternoForm(false);
  };

  const removerProductoExterno = (id: string) => {
    setProductosExternos((prev) => prev.filter((p) => p.id !== id));
  };

  const calcularTotalProductosInventario = () => {
    return productosInventario.reduce(
      (sum, p) => sum + p.precioMinorista * p.cantidad,
      0
    );
  };

  const calcularTotalProductosExternos = () => {
    return productosExternos.reduce(
      (sum, p) => sum + p.precioVenta * p.cantidad,
      0
    );
  };

  const calcularTotalProductos = () => {
    return calcularTotalProductosInventario() + calcularTotalProductosExternos();
  };

  const calcularPrecioManoObra = () => {
    if (!precioServicioTotal || parseFloat(precioServicioTotal) <= 0) {
      return 0;
    }
    const totalProductos = calcularTotalProductos();
    const manoObra = parseFloat(precioServicioTotal) - totalProductos;
    return Math.max(0, manoObra);
  };

  const handleSubmit = () => {
    // Validaciones
    const totalAceites = productosInventario.filter(p => p.tipo === "ACEITE").length + 
                        productosExternos.filter(p => p.tipo === "ACEITE").length;
    const totalFiltros = productosInventario.filter(p => p.tipo === "FILTRO").length + 
                        productosExternos.filter(p => p.tipo === "FILTRO").length;

    if (totalAceites === 0) {
      toast.error("⚠️ Debes agregar al menos un aceite");
      return;
    }

    if (totalFiltros === 0) {
      toast.error("⚠️ Debes agregar al menos un filtro");
      return;
    }

    if (!precioServicioTotal || parseFloat(precioServicioTotal) <= 0) {
      toast.error("⚠️ Debes ingresar el precio total del servicio");
      return;
    }

    const precioTotal = parseFloat(precioServicioTotal);
    const costoProductos = calcularTotalProductos();

    if (precioTotal < costoProductos) {
      toast.error("⚠️ El precio del servicio no puede ser menor al costo de los productos");
      return;
    }

    const precioManoObra = calcularPrecioManoObra();

    console.log("✅ Lubricación completa:");
    console.log("   Productos Inventario:", productosInventario);
    console.log("   Productos Externos:", productosExternos);
    console.log("   Precio Total Servicio:", precioTotal);
    console.log("   Costo Productos:", costoProductos);
    console.log("   Mano de Obra:", precioManoObra);

    // Preparar datos para enviar
    const data = {
      productosInventario: productosInventario.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precioMinorista,
        tipoPrecio: "MINORISTA",
      })),
      repuestosExternos: productosExternos.map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        proveedor: p.proveedor,
      })),
      precioManoObra,
    };

    onAdd(data);
    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getInventarioLabel = (tipo: string) => {
    switch (tipo) {
      case "WAYRA_ENI":
        return "Wayra ENI";
      case "WAYRA_CALAN":
        return "Wayra CALAN";
      case "TORNI_REPUESTO":
        return "TorniRepuestos";
      default:
        return tipo;
    }
  };

  const getInventarioColor = (tipo: string) => {
    switch (tipo) {
      case "WAYRA_ENI":
        return "bg-blue-100 text-blue-700";
      case "WAYRA_CALAN":
        return "bg-cyan-100 text-cyan-700";
      case "TORNI_REPUESTO":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredAceites = aceites.filter(
    (a) =>
      a.nombre.toLowerCase().includes(searchAceite.toLowerCase()) ||
      a.codigo.toLowerCase().includes(searchAceite.toLowerCase())
  );

  const filteredFiltros = filtros.filter(
    (f) =>
      f.nombre.toLowerCase().includes(searchFiltro.toLowerCase()) ||
      f.codigo.toLowerCase().includes(searchFiltro.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Servicio de Lubricación"
      size="xl"
    >
      <div className="space-y-6">
        {/* Información */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-2">
                Servicio de Lubricación
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  1. Selecciona <span className="font-semibold">productos del inventario</span> y/o{" "}
                  <span className="font-semibold">productos externos</span>
                </p>
                <p>
                  2. Ingresa el <span className="font-semibold">precio total del servicio</span>
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Los productos del inventario descontarán stock. Los externos se registrarán como repuestos. La diferencia será mano de obra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Productos seleccionados */}
        {(productosInventario.length > 0 || productosExternos.length > 0) && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h5 className="font-bold text-green-900 mb-3 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Productos Seleccionados
            </h5>
            
            {/* Inventario */}
            {productosInventario.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-700 mb-2">Del Inventario:</div>
                <div className="space-y-2">
                  {productosInventario.map((prod) => (
                    <div key={prod.id} className="bg-white border border-green-300 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {prod.tipo === "ACEITE" ? "🛢️" : "🔧"} {prod.nombre}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                            <span>{prod.codigo}</span>
                            <span className="font-bold text-green-600">
                              ${prod.precioMinorista.toLocaleString()} c/u
                            </span>
                            {prod.inventarioTipo && (
                              <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(prod.inventarioTipo)}`}>
                                {getInventarioLabel(prod.inventarioTipo)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-600">Cantidad:</span>
                            <input
                              type="number"
                              min="1"
                              value={prod.cantidad}
                              onChange={(e) => actualizarCantidadInventario(prod.id, parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm font-bold text-green-700">
                              Subtotal: ${(prod.precioMinorista * prod.cantidad).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerProductoInventario(prod.id)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Externos */}
            {productosExternos.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Externos:</div>
                <div className="space-y-2">
                  {productosExternos.map((prod) => (
                    <div key={prod.id} className="bg-white border border-purple-300 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {prod.tipo === "ACEITE" ? "🛢️" : "🔧"} {prod.nombre}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{prod.descripcion}</div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-gray-600">Cant: {prod.cantidad}</span>
                            <span className="text-orange-600">Compra: ${prod.precioCompra.toLocaleString()}</span>
                            <span className="font-bold text-green-600">Venta: ${prod.precioVenta.toLocaleString()}</span>
                            <span className="text-purple-600">Proveedor: {prod.proveedor}</span>
                          </div>
                          <div className="mt-1 text-sm font-bold text-purple-700">
                            Subtotal: ${(prod.precioVenta * prod.cantidad).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerProductoExterno(prod.id)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Cargando productos...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Aceites */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Droplets className="h-4 w-4 text-blue-600" />
                  </div>
                  <label className="font-semibold text-gray-800">Aceites</label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setTipoExternoForm("ACEITE");
                    setShowExternoForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-xs"
                >
                  <PackagePlus className="h-3 w-3 mr-1" />
                  Externo
                </Button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar aceite..."
                  value={searchAceite}
                  onChange={(e) => setSearchAceite(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                {filteredAceites.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAceites.map((aceite) => {
                      const productoConOrigen = aceite as any;
                      const yaAgregado = productosInventario.some((p) => p.id === aceite.id);

                      return (
                        <button
                          key={aceite.id}
                          onClick={() => agregarProductoInventario(aceite, "ACEITE")}
                          disabled={yaAgregado}
                          className="w-full text-left p-3 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">
                                {aceite.nombre}
                              </h5>
                              <div className="flex flex-wrap gap-2 text-xs mt-1">
                                <span className="text-gray-600">{aceite.codigo}</span>
                                <span className="text-green-600 font-medium">Stock: {aceite.stock}</span>
                                <span className="font-bold text-blue-600">
                                  ${aceite.precioMinorista.toLocaleString()}
                                </span>
                                {productoConOrigen.inventarioOrigen && (
                                  <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(productoConOrigen.inventarioOrigen)}`}>
                                    {getInventarioLabel(productoConOrigen.inventarioOrigen)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!yaAgregado && <Plus className="h-4 w-4 text-blue-600 ml-2" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchAceite ? "No se encontraron aceites" : "No hay aceites disponibles"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Filtros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Filter className="h-4 w-4 text-green-600" />
                  </div>
                  <label className="font-semibold text-gray-800">Filtros</label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setTipoExternoForm("FILTRO");
                    setShowExternoForm(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-xs"
                >
                  <PackagePlus className="h-3 w-3 mr-1" />
                  Externo
                </Button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar filtro..."
                  value={searchFiltro}
                  onChange={(e) => setSearchFiltro(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                {filteredFiltros.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredFiltros.map((filtro) => {
                      const productoConOrigen = filtro as any;
                      const yaAgregado = productosInventario.some((p) => p.id === filtro.id);

                      return (
                        <button
                          key={filtro.id}
                          onClick={() => agregarProductoInventario(filtro, "FILTRO")}
                          disabled={yaAgregado}
                          className="w-full text-left p-3 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">
                                {filtro.nombre}
                              </h5>
                              <div className="flex flex-wrap gap-2 text-xs mt-1">
                                <span className="text-gray-600">{filtro.codigo}</span>
                                <span className="text-green-600 font-medium">Stock: {filtro.stock}</span>
                                <span className="font-bold text-green-600">
                                  ${filtro.precioMinorista.toLocaleString()}
                                </span>
                                {productoConOrigen.inventarioOrigen && (
                                  <span className={`px-2 py-0.5 rounded-full ${getInventarioColor(productoConOrigen.inventarioOrigen)}`}>
                                    {getInventarioLabel(productoConOrigen.inventarioOrigen)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!yaAgregado && <Plus className="h-4 w-4 text-green-600 ml-2" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchFiltro ? "No se encontraron filtros" : "No hay filtros disponibles"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulario Producto Externo */}
        {showExternoForm && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-bold text-purple-900">
                Agregar {tipoExternoForm === "ACEITE" ? "Aceite" : "Filtro"} Externo
              </h5>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowExternoForm(false);
                  resetExternoForm();
                }}
                className="text-gray-600 hover:bg-purple-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <Input
                  type="text"
                  value={nombreExterno}
                  onChange={(e) => setNombreExterno(e.target.value)}
                  placeholder="Ej: Aceite Castrol 20W50"
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <Input
                  type="text"
                  value={descripcionExterno}
                  onChange={(e) => setDescripcionExterno(e.target.value)}
                  placeholder="Descripción adicional"
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={cantidadExterno}
                  onChange={(e) => setCantidadExterno(e.target.value)}
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <Input
                  type="text"
                  value={proveedorExterno}
                  onChange={(e) => setProveedorExterno(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="border-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Compra *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                    $
                  </span>
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={precioCompraExterno}
                    onChange={(e) => setPrecioCompraExterno(e.target.value)}
                    placeholder="0"
                    className="pl-7 border-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                    $
                  </span>
                  <Input
                    type="number"
                    step="100"
                    min="0"
                    value={precioVentaExterno}
                    onChange={(e) => setPrecioVentaExterno(e.target.value)}
                    placeholder="0"
                    className="pl-7 border-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                type="button"
                onClick={agregarProductoExterno}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </div>
        )}

        {/* Precio del Servicio */}
        {(productosInventario.length > 0 || productosExternos.length > 0) && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-5">
            <div className="flex items-start space-x-3 mb-4">
              <DollarSign className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <label className="block font-bold text-indigo-900 mb-2">
                  Precio Total del Servicio *
                </label>
                <p className="text-sm text-indigo-700 mb-3">
                  Ingresa el precio total que cobrarás al cliente (incluye productos + mano de obra)
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium text-lg">
                    $
                  </span>
                  <Input
                    type="number"
                    step="1000"
                    min={calcularTotalProductos()}
                    value={precioServicioTotal}
                    onChange={(e) => setPrecioServicioTotal(e.target.value)}
                    placeholder="0"
                    className="pl-8 h-14 text-2xl font-bold border-2 border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                  Mínimo: ${calcularTotalProductos().toLocaleString()} (costo de productos)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {(productosInventario.length > 0 || productosExternos.length > 0) && (
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-bold text-green-900 mb-3">
                  Resumen del Servicio:
                </h5>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Aceites Inventario</div>
                    <div className="text-lg font-bold text-blue-600">
                      {productosInventario.filter(p => p.tipo === "ACEITE").length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-gray-600 mb-1">Filtros Inventario</div>
                    <div className="text-lg font-bold text-green-600">
                      {productosInventario.filter(p => p.tipo === "FILTRO").length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">Aceites Externos</div>
                    <div className="text-lg font-bold text-purple-600">
                      {productosExternos.filter(p => p.tipo === "ACEITE").length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">Filtros Externos</div>
                    <div className="text-lg font-bold text-purple-600">
                      {productosExternos.filter(p => p.tipo === "FILTRO").length}
                    </div>
                  </div>
                </div>

                {/* Desglose financiero */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Productos Inventario:</span>
                    <span className="font-bold text-blue-700">
                      ${calcularTotalProductosInventario().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Productos Externos:</span>
                    <span className="font-bold text-purple-700">
                      ${calcularTotalProductosExternos().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-green-200">
                    <span className="font-semibold text-gray-700">Total Productos:</span>
                    <span className="font-bold text-gray-900">
                      ${calcularTotalProductos().toLocaleString()}
                    </span>
                  </div>
                  {precioServicioTotal && parseFloat(precioServicioTotal) > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Precio Total Servicio:</span>
                        <span className="font-bold text-indigo-600">
                          ${parseFloat(precioServicioTotal).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-green-200">
                        <span className="font-semibold text-gray-700">Mano de Obra:</span>
                        <span className={`font-bold text-lg ${calcularPrecioManoObra() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${calcularPrecioManoObra().toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                  <div className="text-xs text-green-700 mb-2">
                    📊 Distribución contable:
                  </div>
                  <div className="space-y-1 text-xs text-green-800">
                    {productosInventario.length > 0 && (
                      <div>• Wayra Productos: Venta ${calcularTotalProductosInventario().toLocaleString()} (descuenta stock)</div>
                    )}
                    {productosExternos.length > 0 && (
                      <div>• Repuestos Externos: ${calcularTotalProductosExternos().toLocaleString()}</div>
                    )}
                    {precioServicioTotal && parseFloat(precioServicioTotal) > 0 && (
                      <div>• Wayra Taller: Mano de obra ${calcularPrecioManoObra().toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia */}
        {(productosInventario.length === 0 && productosExternos.length === 0) ||
         !precioServicioTotal ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Información requerida
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {productosInventario.length === 0 && productosExternos.length === 0
                    ? "Debes agregar al menos un producto (del inventario o externo)"
                    : "Debes ingresar el precio total del servicio"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              (productosInventario.length === 0 && productosExternos.length === 0) ||
              !precioServicioTotal ||
              parseFloat(precioServicioTotal) <= 0 ||
              loading
            }
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </div>
    </Modal>
  );
}