"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  Package,
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
  ArrowUpDown,
  Bolt,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/inventario/ProductForm";
import { MovementForm } from "@/components/inventario/MovimientosForm";
import toast from "react-hot-toast";

interface Product {
  id: string;
  codigo: string;
  codigoBarras: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  precioMinorista: number;
  precioMayorista: number;
  stock: number;
  stockMinimo: number;
  aplicaIva: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function TornilleriaPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Verificar permisos
  const hasAccess = [
    "SUPER_USUARIO",
    "ADMIN_TORNI_REPUESTOS",
    "VENDEDOR_TORNI",
  ].includes(session?.user?.role || "");
  const canEdit = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(
    session?.user?.role || ""
  );

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/productos?tipo=TORNILLERIA&categoria=TORNILLERIA"
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setLastUpdate(new Date());
      } else {
        toast.error("Error al cargar productos");
      }
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchProducts();
    }
  }, [hasAccess, fetchProducts]);

  //Polling
  useEffect(() => {
    if (!hasAccess) return;
    const interval = setInterval(() => {
      console.log("🔄 Refrescando tornillería...");
      fetchProducts();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasAccess, fetchProducts]);

  // Listener
  useEffect(() => {
    const handlePriceUpdate = (event: CustomEvent) => {
      console.log("⚡ Precios actualizados, refrescando tornillería...");
      fetchProducts();
      if (
        event.detail?.productosActualizados > 0 &&
        event.detail?.tipo === "TORNI"
      ) {
        toast.success(
          `Precios actualizados: ${event.detail.productosActualizados} productos`,
          {
            icon: "🔄",
            duration: 4000,
          }
        );
      }
    };
    window.addEventListener("price-update" as any, handlePriceUpdate);
    return () =>
      window.removeEventListener("price-update" as any, handlePriceUpdate);
  }, [fetchProducts]);

  const deleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    try {
      const response = await fetch(`/api/productos/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Producto eliminado correctamente");
        fetchProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al eliminar producto");
      }
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.stock <= p.stockMinimo).length,
    totalValue: products.reduce((sum, p) => sum + p.stock * p.precioVenta, 0),
    allWithIva: products.length, // Todos tienen IVA obligatorio
  };
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <div className="text-red-600 text-2xl font-bold mb-3">
            Acceso Denegado
          </div>
          <p className="text-gray-600 max-w-md">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-105">
              <Bolt className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Tornillería Industrial
              </h1>
              <p className="text-gray-200 text-base sm:text-lg">
                Tornillos, tuercas, arandelas y más
              </p>
              <p className="text-gray-200 text-xs sm:text-sm mt-1">
                Última actualización: {lastUpdate.toLocaleTimeString("es-CO")}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Margen 100%
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  IVA 19% Obligatorio
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Alta Rotación
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
              session?.user?.role || ""
            ) && (
              <Button
                onClick={() => setShowProductForm(true)}
                className="bg-white text-gray-800 hover:bg-gray-100 shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tornillo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Tornillería
            </CardTitle>
            <Bolt className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {stats.total}
            </div>
            <p className="text-xs text-gray-600 mt-1">Productos disponibles</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Stock Bajo
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-800">
              {stats.lowStock}
            </div>
            <p className="text-xs text-orange-600 mt-1">Requieren reposición</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Valor Total
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-800">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Inventario tornillería
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Con IVA
            </CardTitle>
            <Settings className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-blue-800">
              {stats.allWithIva}
            </div>
            <p className="text-xs text-blue-600 mt-1">Todos obligatorios</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-2xl border-0 bg-gradient-to-r from-white to-gray-50 transition-all duration-300 hover:shadow-3xl">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar tornillos por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-0 bg-white shadow-md focus:shadow-lg transition-all duration-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="shadow-2xl border-0 bg-white transition-all duration-300 hover:shadow-3xl">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Bolt className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Tornillería Industrial ({filteredProducts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto max-h-[60vh] transition-all duration-300">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Producto
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Stock
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Precios
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      IVA
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                            <Bolt className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {product.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              Código: {product.codigo}
                            </div>
                            {product.descripcion && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {product.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            {product.stock}
                          </span>
                          {product.stock <= product.stockMinimo && (
                            <Badge
                              variant="destructive"
                              className="animate-pulse"
                            >
                              Stock Bajo
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mín: {product.stockMinimo}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-600">
                              Venta:
                            </span>
                            <span className="font-bold text-green-600">
                              ${product.precioVenta.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-600">
                              Minorista:
                            </span>
                            <span className="font-bold text-blue-600">
                              ${product.precioMinorista.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-600">
                              Mayorista:
                            </span>
                            <span className="font-bold text-purple-600">
                              ${product.precioMayorista.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className="bg-blue-100 text-blue-700">
                          IVA 19% Obligatorio
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowMovementForm(true);
                            }}
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 hover:scale-105"
                            title="Movimiento de inventario"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
                            session?.user?.role || ""
                          ) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProduct(product)}
                                className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                                title="Editar producto"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProduct(product.id)}
                                className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300 hover:scale-105"
                                title="Eliminar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4 overflow-y-auto max-h-[60vh] transition-all duration-300">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="shadow-md transition-all duration-300 hover:shadow-lg hover:scale-102"
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                      <Bolt className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-900 text-base">
                        {product.nombre}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        Código: {product.codigo}
                      </div>
                      <div className="space-y-2 text-sm">
                        {product.descripcion && (
                          <div className="text-xs text-gray-400 line-clamp-2">
                            {product.descripcion}
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Stock:</span>
                          <span className="font-bold">{product.stock}</span>
                          {product.stock <= product.stockMinimo && (
                            <Badge
                              variant="destructive"
                              className="text-xs animate-pulse"
                            >
                              Stock Bajo
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mín: {product.stockMinimo}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Venta:</span>
                          <span className="font-bold text-green-600">
                            ${product.precioVenta.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Minorista:</span>
                          <span className="font-bold text-blue-600">
                            ${product.precioMinorista.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Mayorista:</span>
                          <span className="font-bold text-purple-600">
                            ${product.precioMayorista.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">IVA:</span>
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            IVA 19% Obligatorio
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowMovementForm(true);
                        }}
                        className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 hover:scale-105"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
                        session?.user?.role || ""
                      ) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProduct(product.id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300 hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-105">
                <Bolt className="h-12 w-12 text-gray-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">
                No se encontraron productos de tornillería
              </div>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Agrega el primer producto de tornillería para comenzar"}
              </p>
              {!searchTerm &&
                ["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
                  session?.user?.role || ""
                ) && (
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="mt-4 bg-gray-700 hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Producto
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
        session?.user?.role || ""
      ) && (
        <>
          <ProductForm
            isOpen={showProductForm}
            onClose={() => setShowProductForm(false)}
            onSuccess={fetchProducts}
            tipo="TORNILLERIA"
            categoria="TORNILLERIA"
          />

          <ProductForm
            isOpen={!!editingProduct}
            onClose={() => setEditingProduct(null)}
            onSuccess={fetchProducts}
            product={editingProduct}
            tipo="TORNILLERIA"
            categoria="TORNILLERIA"
          />
        </>
      )}

      <MovementForm
        isOpen={showMovementForm}
        onClose={() => {
          setShowMovementForm(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchProducts}
        product={selectedProduct}
        userRole={session?.user?.role}
      />
    </div>
  );
}
