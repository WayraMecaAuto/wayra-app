import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import toast from "react-hot-toast";

interface LubricacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Ahora acepta array de aceites y un solo filtro
  onAdd: (
    productos: Array<{ id: string; nombre: string; tipo: "ACEITE" | "FILTRO" }>
  ) => void;
}

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  stock: number;
  precioVenta: number;
  tipo?: string;
  categoria?: string;
}

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  codigo: string;
  precioVenta: number;
  tipo: "ACEITE" | "FILTRO";
  inventarioTipo?: string;
}

export function LubricacionModal({
  isOpen,
  onClose,
  onAdd,
}: LubricacionModalProps) {
  const [aceites, setAceites] = useState<Producto[]>([]);
  const [filtros, setFiltros] = useState<Producto[]>([]);
  const [aceitesSeleccionados, setAceitesSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [filtroSeleccionado, setFiltroSeleccionado] =
    useState<ProductoSeleccionado | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchAceite, setSearchAceite] = useState("");
  const [searchFiltro, setSearchFiltro] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Limpiar estado al abrir
      setAceitesSeleccionados([]);
      setFiltroSeleccionado(null);
      setSearchAceite("");
      setSearchFiltro("");
      fetchProductos();
    }
  }, [isOpen]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      console.log("📄 Iniciando carga de productos para lubricación...");

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
      const torniLubricantesArray = Array.isArray(torniLubricantesRes)
        ? torniLubricantesRes
        : [];
      const torniFiltrosArray = Array.isArray(torniFiltrosRes)
        ? torniFiltrosRes
        : [];

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

      // Filtrar lubricantes de Wayra (NO incluir filtros)
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

      // Filtrar filtros de Wayra (SOLO filtros)
      const wayraFiltros = [
        ...wayraEniProductos,
        ...wayraCalanProductos,
      ].filter((p) => {
        const nombre = (p.nombre || "").toLowerCase();
        const categoria = (p.categoria || "").toLowerCase();
        const descripcion = (p.descripcion || "").toLowerCase();

        // Buscar que contenga "filtro" Y "aceite" en alguna parte
        const esFiltroAceite =
          (nombre.includes("filtro") && nombre.includes("aceite")) ||
          nombre.includes("filtro aceite") ||
          (categoria.includes("filtro") && nombre.includes("aceite")) ||
          (descripcion.includes("filtro") && descripcion.includes("aceite"));

        return esFiltroAceite && p.stock > 0;
      });

      const todosLosAceites = [
        ...wayraLubricantes,
        ...torniLubricantes.filter((p) => p.stock > 0),
      ];
      const todosLosFiltros = [
        ...wayraFiltros,
        ...torniFiltros.filter((p) => p.stock > 0),
      ];

      console.log(
        "✅ Aceites:",
        todosLosAceites.length,
        "| Filtros:",
        todosLosFiltros.length
      );

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

  const agregarAceite = (producto: Producto) => {
    if (aceitesSeleccionados.some((p) => p.id === producto.id)) {
      toast.error("Este aceite ya está agregado");
      return;
    }

    const productoConOrigen = producto as any;

    setAceitesSeleccionados((prev) => [
      ...prev,
      {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        precioVenta: producto.precioVenta,
        tipo: "ACEITE",
        inventarioTipo: productoConOrigen.inventarioOrigen || producto.tipo,
      },
    ]);
    toast.success(`✅ ${producto.nombre} agregado`);
  };

  const removerAceite = (id: string) => {
    setAceitesSeleccionados((prev) => prev.filter((p) => p.id !== id));
  };

  const seleccionarFiltro = (producto: Producto) => {
    const productoConOrigen = producto as any;

    setFiltroSeleccionado({
      id: producto.id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      precioVenta: producto.precioVenta,
      tipo: "FILTRO",
      inventarioTipo: productoConOrigen.inventarioOrigen || producto.tipo,
    });
    toast.success(`✅ ${producto.nombre} seleccionado`);
  };

  const handleSubmit = () => {
    if (aceitesSeleccionados.length === 0) {
      toast.error("⚠️ Debes agregar al menos un aceite");
      return;
    }

    if (!filtroSeleccionado) {
      toast.error("⚠️ Debes seleccionar un filtro");
      return;
    }

    console.log("✅ Lubricación completa:");
    console.log(
      "   Aceites:",
      aceitesSeleccionados.map((p) => `${p.nombre} (${p.id})`)
    );
    console.log(
      "   Filtro:",
      `${filtroSeleccionado.nombre} (${filtroSeleccionado.id})`
    );

    // Enviar todos los productos seleccionados
    const productosParaAgregar = [
      ...aceitesSeleccionados.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tipo: "ACEITE" as const,
      })),
      {
        id: filtroSeleccionado.id,
        nombre: filtroSeleccionado.nombre,
        tipo: "FILTRO" as const,
      },
    ];

    onAdd(productosParaAgregar);
    handleClose();
  };

  const handleClose = () => {
    setAceitesSeleccionados([]);
    setFiltroSeleccionado(null);
    setSearchAceite("");
    setSearchFiltro("");
    onClose();
  };

  const calcularPrecioTotal = () => {
    const totalAceites = aceitesSeleccionados.reduce(
      (sum, p) => sum + p.precioVenta,
      0
    );
    const precioFiltro = filtroSeleccionado?.precioVenta || 0;
    return totalAceites + precioFiltro;
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
                Servicio de Lubricación Personalizado
              </h4>
              <p className="text-sm text-blue-700">
                Selecciona{" "}
                <span className="font-semibold">uno o más aceites</span> y{" "}
                <span className="font-semibold">un filtro</span> para este
                servicio.
              </p>
            </div>
          </div>
        </div>

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
                  <label className="font-semibold text-gray-800">
                    Aceites Lubricantes
                  </label>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {aceitesSeleccionados.length} agregado
                  {aceitesSeleccionados.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Aceites seleccionados */}
              {aceitesSeleccionados.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
                  {aceitesSeleccionados.map((aceite) => (
                    <div
                      key={aceite.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {aceite.nombre}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                            <span>{aceite.codigo}</span>
                            <span className="font-bold text-green-600">
                              ${aceite.precioVenta.toLocaleString()}
                            </span>
                            {aceite.inventarioTipo && (
                              <span
                                className={`px-2 py-0.5 rounded-full ${getInventarioColor(aceite.inventarioTipo)}`}
                              >
                                {getInventarioLabel(aceite.inventarioTipo)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removerAceite(aceite.id)}
                          className="text-red-600 hover:bg-red-50 ml-2 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Búsqueda aceites */}
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

              {/* Lista aceites */}
              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100">
                {filteredAceites.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAceites.map((aceite) => {
                      const productoConOrigen = aceite as any;
                      const yaAgregado = aceitesSeleccionados.some(
                        (p) => p.id === aceite.id
                      );

                      return (
                        <button
                          key={aceite.id}
                          onClick={() => agregarAceite(aceite)}
                          disabled={yaAgregado}
                          className="w-full text-left p-3 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">
                                {aceite.nombre}
                              </h5>
                              <div className="flex flex-wrap gap-2 text-xs mt-1">
                                <span className="text-gray-600">
                                  {aceite.codigo}
                                </span>
                                <span className="text-green-600 font-medium">
                                  Stock: {aceite.stock}
                                </span>
                                <span className="font-bold text-blue-600">
                                  ${aceite.precioVenta.toLocaleString()}
                                </span>
                                {productoConOrigen.inventarioOrigen && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full ${getInventarioColor(productoConOrigen.inventarioOrigen)}`}
                                  >
                                    {getInventarioLabel(
                                      productoConOrigen.inventarioOrigen
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!yaAgregado && (
                              <Plus className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchAceite
                        ? "No se encontraron aceites"
                        : "No hay aceites disponibles"}
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
                  <label className="font-semibold text-gray-800">
                    Filtro de Aceite
                  </label>
                </div>
              </div>

              {/* Filtro seleccionado */}
              {filtroSeleccionado && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      Seleccionado:
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {filtroSeleccionado.nombre}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                        <span>{filtroSeleccionado.codigo}</span>
                        <span className="font-bold text-green-600">
                          ${filtroSeleccionado.precioVenta.toLocaleString()}
                        </span>
                        {filtroSeleccionado.inventarioTipo && (
                          <span
                            className={`px-2 py-0.5 rounded-full ${getInventarioColor(filtroSeleccionado.inventarioTipo)}`}
                          >
                            {getInventarioLabel(
                              filtroSeleccionado.inventarioTipo
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setFiltroSeleccionado(null)}
                      className="text-red-600 hover:bg-red-50 ml-2 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Búsqueda filtros */}
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

              {/* Lista filtros */}
              <div className="border-2 border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-gray-100">
                {filteredFiltros.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredFiltros.map((filtro) => {
                      const productoConOrigen = filtro as any;
                      const estaSeleccionado =
                        filtroSeleccionado?.id === filtro.id;

                      return (
                        <button
                          key={filtro.id}
                          onClick={() => seleccionarFiltro(filtro)}
                          className={`w-full text-left p-3 transition-colors ${
                            estaSeleccionado
                              ? "bg-green-100 border-l-4 border-green-500"
                              : "hover:bg-green-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm truncate">
                                {filtro.nombre}
                              </h5>
                              <div className="flex flex-wrap gap-2 text-xs mt-1">
                                <span className="text-gray-600">
                                  {filtro.codigo}
                                </span>
                                <span className="text-green-600 font-medium">
                                  Stock: {filtro.stock}
                                </span>
                                <span className="font-bold text-green-600">
                                  ${filtro.precioVenta.toLocaleString()}
                                </span>
                                {productoConOrigen.inventarioOrigen && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full ${getInventarioColor(productoConOrigen.inventarioOrigen)}`}
                                  >
                                    {getInventarioLabel(
                                      productoConOrigen.inventarioOrigen
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            {estaSeleccionado && (
                              <CheckCircle2 className="h-5 w-5 text-green-600 ml-2 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchFiltro
                        ? "No se encontraron filtros"
                        : "No hay filtros disponibles"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {(aceitesSeleccionados.length > 0 || filtroSeleccionado) && (
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 rounded-xl p-5">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-bold text-green-900 mb-3">
                  Resumen del Servicio:
                </h5>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Aceites</div>
                    <div className="text-xl font-bold text-blue-600">
                      {aceitesSeleccionados.length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Filtro</div>
                    <div className="text-xl font-bold text-green-600">
                      {filtroSeleccionado ? "1" : "0"}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-900">
                      Precio Total:
                    </span>
                    <span className="text-2xl font-bold text-green-700">
                      ${calcularPrecioTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advertencia */}
        {(aceitesSeleccionados.length === 0 || !filtroSeleccionado) &&
          !loading && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Selección incompleta
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {aceitesSeleccionados.length === 0 && !filtroSeleccionado
                      ? "Debes agregar al menos un aceite y seleccionar un filtro"
                      : aceitesSeleccionados.length === 0
                        ? "Debes agregar al menos un aceite"
                        : "Debes seleccionar un filtro"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              aceitesSeleccionados.length === 0 ||
              !filtroSeleccionado ||
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
