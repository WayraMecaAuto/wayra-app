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
  Camera,
  ArrowUpDown,
  Eye,
  Droplets,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/inventario/ProductForm";
import { MovementForm } from "@/components/inventario/MovimientosForm";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { BarcodeDisplay } from "@/components/ui/barcode-display";
import Image from "next/image";
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

export default function LubricantesPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBarcodeView, setShowBarcodeView] = useState<Product | null>(null);

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
        "/api/productos?tipo=TORNI_REPUESTO&categoria=LUBRICANTES"
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
      console.log("🔄 Refrescando lubricantes...");
      fetchProducts();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasAccess, fetchProducts]);

  // Listener
  useEffect(() => {
    const handlePriceUpdate = (event: CustomEvent) => {
      console.log("⚡ Precios actualizados, refrescando lubricantes...");
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

  const handleBarcodeScanned = async (code: string) => {
    console.log("🔍 Código escaneado en página:", code);
    try {
      const response = await fetch(`/api/productos/barcode/${code}`);
      console.log("📡 Respuesta del servidor:", response.status);

      if (response.ok) {
        const product = await response.json();
        console.log("📦 Producto encontrado:", product);
        if (
          product.tipo === "TORNI_REPUESTO" &&
          product.categoria === "LUBRICANTES"
        ) {
          setSelectedProduct(product);
          setShowMovementForm(true);
          toast.success(`Producto encontrado: ${product.nombre}`);
        } else {
          toast.error("Este producto no pertenece a Lubricantes");
        }
      } else {
        const error = await response.json();
        console.log("❌ Error del servidor:", error);

        if (response.status === 404) {
          const shouldCreate = confirm(
            `Producto con código ${code} no encontrado.\n¿Deseas crear un nuevo producto con este código de barras?`
          );
          if (shouldCreate) {
            setShowProductForm(true);
            setTimeout(() => {
              const barcodeInput = document.querySelector(
                'input[placeholder*="Escanear"]'
              ) as HTMLInputElement;
              if (barcodeInput) {
                barcodeInput.value = code;
                barcodeInput.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
              }
            }, 100);
          }
        } else {
          toast.error("Error al buscar producto");
        }
      }
    } catch (error) {
      console.error("💥 Error en handleBarcodeScanned:", error);
      toast.error("Error al buscar producto");
    }
    setShowScanner(false);
  };

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
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.stock <= p.stockMinimo).length,
    totalValue: products.reduce((sum, p) => sum + p.stock * p.precioVenta, 0),
    withIva: products.filter((p) => p.aplicaIva).length,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl transition-all duration-300 hover:shadow-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/TorniRepuestos.png"
                alt="TorniRepuestos Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Lubricantes Automotrices
              </h1>
              <p className="text-indigo-100 text-base sm:text-lg">
                Aceites, grasas y lubricantes especializados
              </p>
              <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                Última actualización de precios: {lastUpdate.toLocaleTimeString("es-CO")}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Margen 15%
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  IVA 19% Opcional
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Descuentos Especiales
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => setShowScanner(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Camera className="h-4 w-4 mr-2" />
              Escanear
            </Button>
            {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
              session?.user?.role || ""
            ) && (
              <Button
                onClick={() => setShowProductForm(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Lubricante
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">
              Total Lubricantes
            </CardTitle>
            <Droplets className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-800">
              {stats.total}
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              Lubricantes disponibles
            </p>
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
              Inventario lubricantes
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
              {stats.withIva}
            </div>
            <p className="text-xs text-blue-600 mt-1">Productos con IVA</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="shadow-xl border-0 bg-gradient-to-r from-white to-indigo-50 transition-all duration-300 hover:shadow-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Buscar lubricantes automotrices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-0 bg-white shadow-md focus:shadow-lg transition-all duration-300 focus:scale-102"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="shadow-2xl border-0 bg-white transition-all duration-300 hover:shadow-3xl">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
            <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Lubricantes Automotrices ({filteredProducts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[25%]">
                      Producto
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[15%]">
                      Stock
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[20%]">
                      Precios
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[10%]">
                      IVA
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[20%]">
                      Código de Barras
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700 w-[10%]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-25 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                            <Droplets className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                              {product.nombre}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
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
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            {product.stock}
                          </span>
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
                      </td>
                      <td className="py-4 px-4 sm:px-6">
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
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <Badge
                          variant={product.aplicaIva ? "default" : "secondary"}
                          className={
                            product.aplicaIva
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {product.aplicaIva ? "IVA 19%" : "Sin IVA"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-[150px]">
                            {product.codigoBarras}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowBarcodeView(product)}
                            className="h-8 w-8 p-0 flex items-center justify-center hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:scale-105"
                            title="Ver código de barras"
                          >
                            <Eye className="h-4 w-4 text-indigo-600" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowMovementForm(true);
                            }}
                            className="h-8 w-8 p-0 flex items-center justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 hover:scale-105"
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
                                className="h-8 w-8 p-0 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                                title="Editar producto"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProduct(product.id)}
                                className="h-8 w-8 p-0 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300 hover:scale-105"
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
          <div className="md:hidden space-y-4 p-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-gray-100">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="shadow-md transition-all duration-300 hover:shadow-lg hover:scale-102"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
                        <Droplets className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold text-gray-900 text-base truncate">
                          {product.nombre}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          Código: {product.codigo}
                        </div>
                        {product.descripcion && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {product.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
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
                        <Badge
                          variant={product.aplicaIva ? "default" : "secondary"}
                          className={
                            product.aplicaIva
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {product.aplicaIva ? "IVA 19%" : "Sin IVA"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Código de Barras:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-[120px]">
                          {product.codigoBarras}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBarcodeView(product)}
                          className="h-8 w-8 p-0 flex items-center justify-center hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-300 hover:scale-105"
                          title="Ver código de barras"
                        >
                          <Eye className="h-4 w-4 text-indigo-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowMovementForm(true);
                        }}
                        className="h-8 flex-1 min-w-[80px] hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-300 hover:scale-105"
                      >
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Movimiento
                      </Button>
                      {["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
                        session?.user?.role || ""
                      ) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                            className="h-8 flex-1 min-w-[80px] hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProduct(product.id)}
                            className="h-8 flex-1 min-w-[80px] hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300 hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
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
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-105">
                <Droplets className="h-12 w-12 text-indigo-500" />
              </div>
              <div className="text-gray-500 text-xl font-medium">
                No se encontraron lubricantes
              </div>
              <p className="text-gray-400 mt-2 max-w-md mx-auto">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Agrega el primer lubricante automotriz para comenzar"}
              </p>
              {!searchTerm &&
                ["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
                  session?.user?.role || ""
                ) && (
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Lubricante
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
            tipo="TORNI_REPUESTO"
            categoria="LUBRICANTES"
          />

          <ProductForm
            isOpen={!!editingProduct}
            onClose={() => setEditingProduct(null)}
            onSuccess={fetchProducts}
            product={editingProduct}
            tipo="TORNI_REPUESTO"
            categoria="LUBRICANTES"
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

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Barcode View Modal */}
      {showBarcodeView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl transition-all duration-300 hover:shadow-3xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Código de Barras
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBarcodeView(null)}
                className="hover:bg-gray-100 transition-all duration-300 hover:scale-110"
              >
                ×
              </Button>
            </div>
            <div className="text-center">
              <h4 className="font-medium mb-4 text-gray-700 text-sm sm:text-base truncate">
                {showBarcodeView.nombre}
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <BarcodeDisplay value={showBarcodeView.codigoBarras} />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-3">
                Código: {showBarcodeView.codigo}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
