"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Package,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

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
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: Producto, tipoPrecio: string) => void;
}

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
    }
  }, [isOpen]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      // Cargar todos los productos disponibles
      const [wayraEni, wayraCalan, torniRepuestos, tornilleria] =
        await Promise.all([
          fetch("/api/productos?tipo=WAYRA_ENI").then((r) =>
            r.ok ? r.json() : []
          ),
          fetch("/api/productos?tipo=WAYRA_CALAN").then((r) =>
            r.ok ? r.json() : []
          ),
          fetch("/api/productos?tipo=TORNI_REPUESTO").then((r) =>
            r.ok ? r.json() : []
          ),
          fetch("/api/productos?tipo=TORNILLERIA").then((r) =>
            r.ok ? r.json() : []
          ),
        ]);

      const todosProductos = [
        ...wayraEni,
        ...wayraCalan,
        ...torniRepuestos,
        ...tornilleria,
      ].filter((p) => p.stock > 0 && p.isActive);

      setProductos(todosProductos);
      console.log(`✅ ${todosProductos.length} productos cargados`);
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

    const matchesCategoria =
      filterCategoria === "ALL" || p.categoria === filterCategoria;

    return matchesSearch && matchesTipo && matchesCategoria;
  });

  const handleSelectProduct = (producto: Producto, tipoPrecio: string) => {
    onSelect(producto, tipoPrecio);
    toast.success(`${producto.nombre} agregado con precio ${tipoPrecio}`);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      WAYRA_ENI: "Wayra ENI",
      WAYRA_CALAN: "Wayra CALAN",
      TORNI_REPUESTO: "TorniRepuestos",
      TORNILLERIA: "Tornillería",
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: { [key: string]: string } = {
      WAYRA_ENI: "bg-blue-100 text-blue-700",
      WAYRA_CALAN: "bg-cyan-100 text-cyan-700",
      TORNI_REPUESTO: "bg-purple-100 text-purple-700",
      TORNILLERIA: "bg-gray-100 text-gray-700",
    };
    return colors[tipo] || "bg-gray-100 text-gray-700";
  };

  const categorias = Array.from(
    new Set(productos.map((p) => p.categoria))
  ).sort();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Productos"
      size="xl"
    >
      {/* Contenedor principal con altura controlada */}
      <div className="flex flex-col" style={{ height: 'calc(90vh - 180px)', maxHeight: '600px' }}>
        {/* Filtros - Fijo arriba */}
        <div className="flex-shrink-0 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="WAYRA_ENI">Wayra ENI</option>
              <option value="WAYRA_CALAN">Wayra CALAN</option>
              <option value="TORNI_REPUESTO">TorniRepuestos</option>
              <option value="TORNILLERIA">Tornillería</option>
            </select>

            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="ALL">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de productos con scroll - Área flexible */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 font-medium">Cargando productos...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {filteredProductos.length > 0 ? (
                filteredProductos.map((producto) => (
                  <div
                    key={producto.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {producto.nombre}
                          </h4>
                          <Badge className={getTipoColor(producto.tipo)}>
                            {getTipoLabel(producto.tipo)}
                          </Badge>
                          {producto.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {producto.categoria}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                          <span className="font-medium">Código: {producto.codigo}</span>
                          <span
                            className={`font-semibold ${
                              producto.stock <= 5
                                ? "text-red-600 bg-red-50 px-2 py-0.5 rounded"
                                : "text-green-600 bg-green-50 px-2 py-0.5 rounded"
                            }`}
                          >
                            Stock: {producto.stock}
                          </span>
                        </div>

                        {/* Opciones de precio */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectProduct(producto, "VENTA")}
                            className="bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Venta: ${producto.precioVenta.toLocaleString()}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSelectProduct(producto, "MINORISTA")}
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Minorista: ${producto.precioMinorista.toLocaleString()}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSelectProduct(producto, "MAYORISTA")}
                            className="bg-purple-600 hover:bg-purple-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Mayorista: ${producto.precioMayorista.toLocaleString()}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">
                      {search
                        ? "No se encontraron productos"
                        : "No hay productos disponibles"}
                    </p>
                    {search && (
                      <p className="text-gray-400 text-sm mt-2">
                        Intenta con otra búsqueda
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fijo abajo */}
        <div className="flex-shrink-0 pt-4 border-t mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-600">
              {filteredProductos.length} producto{filteredProductos.length !== 1 ? "s" : ""} disponible{filteredProductos.length !== 1 ? "s" : ""}
            </p>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-gray-100 transition-colors"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.5) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </Modal>
  );
}