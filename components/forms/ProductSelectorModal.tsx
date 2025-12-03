"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, Filter, DollarSign, Edit, X, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: any, cantidad: number, precioPersonalizado?: number) => void;
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: ProductSelectorModalProps) {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("TODOS");
  const [precioPersonalizado, setPrecioPersonalizado] = useState<string>("");
  const [editandoPrecio, setEditandoPrecio] = useState(false);
  const [cantidad, setCantidad] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      fetchProductos();
    }
  }, [isOpen]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/productos");
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
      }
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (producto: any) => {
    setSelectedProduct(producto);
    setPrecioPersonalizado("");
    setEditandoPrecio(false);
    setCantidad(1);
  };

  const handleConfirm = () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    if (cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (cantidad > selectedProduct.stock) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock}`);
      return;
    }

    // Si hay precio personalizado, validarlo
    if (editandoPrecio && precioPersonalizado) {
      const precioNum = parseFloat(precioPersonalizado);
      if (precioNum <= 0 || isNaN(precioNum)) {
        toast.error("Ingresa un precio válido");
        return;
      }
      onSelect(selectedProduct, cantidad, precioNum);
    } else {
      // Usar precio de venta por defecto
      onSelect(selectedProduct, cantidad);
    }

    handleClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setPrecioPersonalizado("");
    setEditandoPrecio(false);
    setSearchTerm("");
    setCategoriaFiltro("TODOS");
    setCantidad(1);
    onClose();
  };

  const incrementarCantidad = () => {
    if (selectedProduct && cantidad < selectedProduct.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementarCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategoria =
      categoriaFiltro === "TODOS" || p.tipo === categoriaFiltro;

    return matchesSearch && matchesCategoria;
  });

  // Agrupar por tipo
  const productosAgrupados = productosFiltrados.reduce((acc: any, producto) => {
    const tipo = producto.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(producto);
    return acc;
  }, {});

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "WAYRA_ENI":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "WAYRA_CALAN":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "WAYRA_OTROS":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "TORNI_REPUESTO":
        return "bg-red-100 text-red-700 border-red-300";
      case "TORNILLERIA":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-green-100 text-green-700 border-green-300";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "WAYRA_ENI":
        return "Wayra ENI";
      case "WAYRA_CALAN":
        return "Wayra CALAN";
      case "WAYRA_OTROS":
        return "Wayra OTROS";
      case "TORNI_REPUESTO":
        return "TorniRepuestos";
      case "TORNILLERIA":
        return "Tornillería";
      default:
        return tipo;
    }
  };

  const categorias = ["TODOS", ...new Set(productos.map((p) => p.tipo))];

  const getPrecioFinal = () => {
    if (!selectedProduct) return 0;
    if (editandoPrecio && precioPersonalizado) {
      return parseFloat(precioPersonalizado) || 0;
    }
    return selectedProduct.precioVenta;
  };

  const getSubtotal = () => {
    return getPrecioFinal() * cantidad;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Seleccionar Producto" size="xl">
      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, código o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filtros de categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoriaFiltro === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat === "TODOS" ? "Todos" : getTipoLabel(cat)}
            </button>
          ))}
        </div>

        {/* Lista de productos agrupados */}
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : Object.keys(productosAgrupados).length > 0 ? (
            <div>
              {Object.entries(productosAgrupados).map(([tipo, productos]: [string, any]) => (
                <div key={tipo} className="border-b last:border-b-0">
                  <div className={`sticky top-0 z-10 px-4 py-2 font-semibold text-sm ${getTipoColor(tipo)}`}>
                    {getTipoLabel(tipo)} ({productos.length})
                  </div>
                  
                  <div className="divide-y">
                    {productos.map((producto: any) => (
                      <button
                        key={producto.id}
                        onClick={() => handleSelectProduct(producto)}
                        className={`w-full p-3 text-left hover:bg-blue-50 transition-colors ${
                          selectedProduct?.id === producto.id ? "bg-blue-100 border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {producto.nombre}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Código: {producto.codigo} | Stock: {producto.stock}
                            </div>
                            {producto.codigoBarras && (
                              <div className="text-xs text-gray-400 mt-0.5 truncate">
                                Barcode: {producto.codigoBarras}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-green-600">
                              ${producto.precioVenta.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: ${producto.precioMinorista.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              May: ${producto.precioMayorista.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Producto seleccionado */}
        {selectedProduct && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {selectedProduct.nombre}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getTipoColor(selectedProduct.tipo)}`}>
                    {getTipoLabel(selectedProduct.tipo)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Stock: {selectedProduct.stock} | Código: {selectedProduct.codigo}
                </div>
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad:
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={decrementarCantidad}
                  disabled={cantidad <= 1}
                  className="h-9 w-9 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={cantidad}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= selectedProduct.stock) {
                      setCantidad(val);
                    }
                  }}
                  className="w-20 text-center h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={incrementarCantidad}
                  disabled={cantidad >= selectedProduct.stock}
                  className="h-9 w-9 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  / {selectedProduct.stock} disponibles
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Precio Unitario:</span>
                <div className="flex items-center gap-2">
                  {!editandoPrecio ? (
                    <>
                      <span className="text-xl font-bold text-green-600">
                        ${selectedProduct.precioVenta.toLocaleString()}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditandoPrecio(true);
                          setPrecioPersonalizado(selectedProduct.precioVenta.toString());
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={precioPersonalizado}
                          onChange={(e) => setPrecioPersonalizado(e.target.value)}
                          className="pl-7 h-9 text-sm"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditandoPrecio(false);
                          setPrecioPersonalizado("");
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-base font-semibold text-gray-700">Subtotal:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${getSubtotal().toLocaleString()}
                </span>
              </div>

              {editandoPrecio && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Puedes editar el precio para esta orden específica
                </div>
              )}

              {!editandoPrecio && (
                <div className="text-xs text-gray-500">
                  Precio Minorista: ${selectedProduct.precioMinorista.toLocaleString()} | 
                  Mayorista: ${selectedProduct.precioMayorista.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProduct}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            Agregar Producto
          </Button>
        </div>
      </div>
    </Modal>
  );
}