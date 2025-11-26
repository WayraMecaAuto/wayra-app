"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import Dropdown from "./Dropdown";
import { motion, AnimatePresence } from "framer-motion";

interface Producto {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  categoria: string;
  stock: number;
  precioVenta: number;
  precioMinorista: number;
  precioMayorista: number;
  isActive?: boolean;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: Producto, tipoPrecio: string) => void;
}

const tipoOptions = [
  { value: "ALL", label: "Todos los tipos" },
  { value: "WAYRA_ENI", label: "Wayra ENI" },
  { value: "WAYRA_CALAN", label: "Wayra CALAN" },
  { value: "WAYRA_OTROS", label: "Wayra OTROS" },
  { value: "TORNI_REPUESTO", label: "TorniRepuestos" },
  { value: "TORNILLERIA", label: "Tornillería" },
];

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: ProductSelectorModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("ALL");
  const [filterCategoria, setFilterCategoria] = useState<string>("ALL");

  useEffect(() => {
    if (isOpen) {
      fetchProductos();
      setSearch("");
      setFilterTipo("ALL");
      setFilterCategoria("ALL");
    }
  }, [isOpen]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const [wayraEni, wayraCalan, wayraOtros, torniRepuestos, tornilleria] =
        await Promise.all([
          fetch("/api/productos?tipo=WAYRA_ENI").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/productos?tipo=WAYRA_CALAN").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/productos?tipo=WAYRA_OTROS").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/productos?tipo=TORNI_REPUESTO").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/productos?tipo=TORNILLERIA").then((r) => (r.ok ? r.json() : [])),
        ]);

      const todosProductos = [
        ...wayraEni,
        ...wayraCalan,
        ...wayraOtros,
        ...torniRepuestos,
        ...tornilleria,
      ].filter((p) => p.stock > 0 && p.isActive !== false);

      setProductos(todosProductos);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = filterTipo === "ALL" || p.tipo === filterTipo;
    const matchesCategoria = filterCategoria === "ALL" || p.categoria === filterCategoria;
    return matchesSearch && matchesTipo && matchesCategoria;
  });

  const categorias = Array.from(new Set(productos.map((p) => p.categoria)))
    .filter(Boolean)
    .sort();

  const categoriaOptions = [
    { value: "ALL", label: "Todas las categorías" },
    ...categorias.map((cat) => ({ value: cat, label: cat })),
  ];

  const handleSelectProduct = (producto: Producto, tipoPrecio: string) => {
    onSelect(producto, tipoPrecio);
    toast.success(`${producto.nombre} agregado (${tipoPrecio})`);
    onClose();
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      WAYRA_ENI: "bg-blue-100 text-blue-700 border-blue-200",
      WAYRA_CALAN: "bg-cyan-100 text-cyan-700 border-cyan-200",
      WAYRA_OTROS: "bg-purple-100 text-purple-700 border-purple-200",
      TORNI_REPUESTO: "bg-indigo-100 text-indigo-700 border-indigo-200",
      TORNILLERIA: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[tipo] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Producto" size="xl">
      <div className="flex flex-col h-[85vh] max-h-[700px]">
        {/* Filtros - siempre visibles */}
        <div className="flex flex-col gap-4 pb-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Dropdown
              options={tipoOptions}
              value={filterTipo}
              onChange={setFilterTipo}
              placeholder="Tipo de producto"
              icon={<Package className="h-4 w-4" />}
            />
            <Dropdown
              options={categoriaOptions}
              value={filterCategoria}
              onChange={setFilterCategoria}
              placeholder="Categoría"
              icon={<div className="w-4 h-4 rounded bg-gray-300" />}
            />
          </div>
        </div>

        {/* Lista de productos con scroll controlado */}
        <div className="flex-1 overflow-hidden mt-4">
          <div className="h-full overflow-y-auto pr-2 -mr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando productos...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredProductos.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 pb-6"
                  >
                    {filteredProductos.map((producto, index) => (
                      <motion.div
                        key={producto.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-lg truncate">
                                {producto.nombre}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge className={getTipoColor(producto.tipo)}>
                                  {tipoOptions.find(o => o.value === producto.tipo)?.label || producto.tipo}
                                </Badge>
                                {producto.categoria && (
                                  <Badge variant="outline" className="text-xs">
                                    {producto.categoria}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">Código</span>
                              <p className="font-mono font-medium text-gray-800">
                                {producto.codigo}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span
                              className={`font-semibold px-3 py-1 rounded-full text-sm ${
                                producto.stock <= 5
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              Stock: {producto.stock}
                            </span>
                          </div>

                          {/* Botones de precio */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleSelectProduct(producto, "VENTA")}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium h-11"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Venta: ${producto.precioVenta.toLocaleString()}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSelectProduct(producto, "MINORISTA")}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Minorista: ${producto.precioMinorista.toLocaleString()}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSelectProduct(producto, "MAYORISTA")}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-medium h-11"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Mayorista: ${producto.precioMayorista.toLocaleString()}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full py-20 text-center"
                  >
                    <Package className="h-20 w-20 text-gray-300 mb-4" />
                    <p className="text-xl font-medium text-gray-600">
                      {search || filterTipo !== "ALL" || filterCategoria !== "ALL"
                        ? "No se encontraron productos"
                        : "No hay productos disponibles"}
                    </p>
                    {(search || filterTipo !== "ALL" || filterCategoria !== "ALL") && (
                      <p className="text-gray-500 mt-2">
                        Prueba ajustando los filtros
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm font-medium text-gray-600">
            {filteredProductos.length} producto{filteredProductos.length !== 1 ? "s" : ""}{" "}
            encontrado{filteredProductos.length !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {/* Scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </Modal>
  );
}