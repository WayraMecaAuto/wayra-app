"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, DollarSign } from "lucide-react";
import Dropdown from "@/components/forms/Dropdown";
import toast from "react-hot-toast";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (producto: any, tipoPrecio: string, precioPersonalizado?: number) => void;
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
  const [tipoPrecio, setTipoPrecio] = useState<string>("VENTA");
  const [precioPersonalizado, setPrecioPersonalizado] = useState<string>("");

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
    setTipoPrecio("VENTA");
    setPrecioPersonalizado("");
  };

  const handleConfirm = () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    // ✅ SI HAY PRECIO PERSONALIZADO, USARLO
    if (tipoPrecio === "PERSONALIZADO" && precioPersonalizado) {
      const precioNum = parseFloat(precioPersonalizado);
      if (precioNum <= 0 || isNaN(precioNum)) {
        toast.error("Ingresa un precio válido");
        return;
      }
      onSelect(selectedProduct, "PERSONALIZADO", precioNum);
    } else {
      // ✅ SI NO, USAR EL TIPO DE PRECIO SELECCIONADO
      onSelect(selectedProduct, tipoPrecio);
    }

    handleClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setTipoPrecio("VENTA");
    setPrecioPersonalizado("");
    setSearchTerm("");
    onClose();
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPrecioActual = () => {
    if (!selectedProduct) return 0;
    if (tipoPrecio === "PERSONALIZADO") {
      return parseFloat(precioPersonalizado) || 0;
    }
    switch (tipoPrecio) {
      case "MINORISTA":
        return selectedProduct.precioMinorista;
      case "MAYORISTA":
        return selectedProduct.precioMayorista;
      case "VENTA":
      default:
        return selectedProduct.precioVenta;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Seleccionar Producto" size="xl">
      <div className="space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Lista de productos */}
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="divide-y">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => handleSelectProduct(producto)}
                  className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${
                    selectedProduct?.id === producto.id ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {producto.codigo} | Stock: {producto.stock}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        ${producto.precioVenta.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Selección de precio */}
        {selectedProduct && (
          <div className="space-y-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Configurar Precio</span>
            </div>

            {/* Producto seleccionado */}
            <div className="bg-white p-3 rounded-lg border border-green-300">
              <div className="font-semibold text-gray-900">{selectedProduct.nombre}</div>
              <div className="text-sm text-gray-600">Stock disponible: {selectedProduct.stock}</div>
            </div>

            {/* Dropdown de tipo de precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Precio *
              </label>
              <Dropdown
                options={[
                  {
                    value: "VENTA",
                    label: `💰 Precio Venta - $${selectedProduct.precioVenta?.toLocaleString() || 0}`,
                  },
                  {
                    value: "MINORISTA",
                    label: `🏪 Precio Minorista - $${selectedProduct.precioMinorista?.toLocaleString() || 0}`,
                  },
                  {
                    value: "MAYORISTA",
                    label: `📦 Precio Mayorista - $${selectedProduct.precioMayorista?.toLocaleString() || 0}`,
                  },
                  {
                    value: "PERSONALIZADO",
                    label: "✏️ Precio Personalizado",
                  },
                ]}
                value={tipoPrecio}
                onChange={(val) => {
                  setTipoPrecio(val);
                  if (val !== "PERSONALIZADO") {
                    setPrecioPersonalizado("");
                  }
                }}
                placeholder="Selecciona un tipo de precio..."
                icon={<DollarSign className="h-4 w-4 text-green-600" />}
              />
            </div>

            {/* Input de precio personalizado */}
            {tipoPrecio === "PERSONALIZADO" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Personalizado *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ingresa precio personalizado"
                  value={precioPersonalizado}
                  onChange={(e) => setPrecioPersonalizado(e.target.value)}
                  className="h-12 text-lg font-semibold"
                />
              </div>
            )}

            {/* Preview del precio */}
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Precio que se aplicará:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${getPrecioActual().toLocaleString()}
                </span>
              </div>
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
            className="bg-green-600 hover:bg-green-700"
          >
            Agregar Producto
          </Button>
        </div>
      </div>
    </Modal>
  );
}