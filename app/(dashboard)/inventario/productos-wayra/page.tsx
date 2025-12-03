"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  CreditCard as Edit,
  Trash2,
  Package,
  AlertTriangle,
  BarChart3,
  Camera,
  ArrowUpDown,
  Eye,
  Filter,
  Settings,
  DollarSign,
  Globe,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/inventario/ProductForm";
import { MovementForm } from "@/components/inventario/MovimientosForm";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { BarcodeDisplay } from "@/components/ui/barcode-display";
import Dropdown from "@/components/forms/Dropdown";
import Image from "next/image";
import toast from "react-hot-toast";

interface Product {
  id: string;
  codigo: string;
  codigoBarras: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  precioMinorista: number;
  precioMayorista: number;
  stock: number;
  stockMinimo: number;
  aplicaIva: boolean;
  monedaCompra: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProductosWayraPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "WAYRA_ENI" | "WAYRA_CALAN" | "WAYRA_OTROS"
  >("ALL");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBarcodeView, setShowBarcodeView] = useState<Product | null>(null);
  const [newProductType, setNewProductType] = useState<
    "WAYRA_ENI" | "WAYRA_CALAN" | "WAYRA_OTROS"
  >("WAYRA_ENI");
  const [scannedBarcode, setScannedBarcode] = useState<string>("");

  // Verificar permisos
  const hasAccess = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_PRODUCTOS",
    "VENDEDOR_WAYRA",
  ].includes(session?.user?.role || "");
  const canEdit = ["SUPER_USUARIO", "ADMIN_WAYRA_PRODUCTOS"].includes(
    session?.user?.role || ""
  );

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/productos?tipo=WAYRA_ENI,WAYRA_CALAN,WAYRA_OTROS"
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

  useEffect(() => {
    if (!hasAccess) return;

    const interval = setInterval(() => {
      console.log("🔄 Refrescando productos Wayra...");
      fetchProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, [hasAccess, fetchProducts]);

  useEffect(() => {
    const handlePriceUpdate = (event: CustomEvent) => {
      console.log("⚡ Precios actualizados, refrescando productos Wayra...");
      fetchProducts();

      if (
        event.detail?.productosActualizados > 0 &&
        event.detail?.tipo === "WAYRA"
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

    return () => {
      window.removeEventListener("price-update" as any, handlePriceUpdate);
    };
  }, [fetchProducts]);

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await fetch(
        `/api/productos/barcode/${encodeURIComponent(code)}`
      );

      if (response.ok) {
        const product = await response.json();
        if (
          product.tipo === "WAYRA_ENI" ||
          product.tipo === "WAYRA_CALAN" ||
          product.tipo === "WAYRA_OTROS"
        ) {
          if (session?.user?.role === "VENDEDOR") {
            setSelectedProduct({ ...product, movementType: "SALIDA" });
          } else {
            setSelectedProduct(product);
          }
          setShowMovementForm(true);
          toast.success(`Producto encontrado: ${product.nombre}`);
        } else {
          toast.error("Este producto no pertenece a Wayra");
        }
      } else if (response.status === 404 && canEdit) {
        // Preguntar tipo al crear nuevo producto desde escáner
        const tipo = prompt(
          `Producto con código ${code} no encontrado.\n\n¿De qué tipo Wayra deseas crear este producto?\n\nEscribe: ENI | CALAN | OTROS`,
          "ENI"
        );

        const tipoNormalizado = tipo?.trim().toUpperCase();
        if (["ENI", "CALAN", "OTROS"].includes(tipoNormalizado)) {
          const tipoMap = {
            ENI: "WAYRA_ENI",
            CALAN: "WAYRA_CALAN",
            OTROS: "WAYRA_OTROS",
          } as const;

          setScannedBarcode(code);
          setNewProductType(tipoMap[tipoNormalizado as keyof typeof tipoMap]);
          setShowProductForm(true);
          toast.success(
            `Creando nuevo producto ${tipoNormalizado} con código ${code}`
          );
        } else {
          toast.error("Tipo no válido. Operación cancelada.");
        }
      } else {
        toast.error("Producto no encontrado");
      }
    } catch (error) {
      toast.error("Error al buscar producto");
    } finally {
      setShowScanner(false);
    }
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "ALL" || product.tipo === filterType;

    return matchesSearch && matchesType;
  });

  const stats = {
    totalENI: products.filter((p) => p.tipo === "WAYRA_ENI").length,
    totalCALAN: products.filter((p) => p.tipo === "WAYRA_CALAN").length,
    totalOTROS: products.filter((p) => p.tipo === "WAYRA_OTROS").length,
    lowStock: products.filter((p) => p.stock <= p.stockMinimo).length,
    totalValue: products.reduce((sum, p) => sum + p.stock * p.precioVenta, 0),
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-blue-600 font-medium">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header - Mejorado con gradientes y animaciones */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-2xl transform hover:scale-[1.01] transition-transform duration-300 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg hover:rotate-6 transition-transform duration-300">
                <Image
                  src="/images/WayraNuevoLogo.png"
                  alt="Wayra Logo"
                  width={70}
                  height={70}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                  Productos Wayra
                </h1>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                  ENI (Nacional), CALAN (Importado) y Otros
                </p>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">
                  Última actualización: {lastUpdate.toLocaleTimeString("es-CO")}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    ENI: Sin IVA
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    CALAN: IVA 15%
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    Otros: Configurable
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción - Ocultos en mobile, visibles en desktop */}
            <div className="hidden lg:flex space-x-3">
              <Button
                onClick={() => setShowScanner(true)}
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Camera className="h-4 w-4 mr-2" />
                Escanear
              </Button>
              {canEdit && (
                <>
                  <Button
                    onClick={() => {
                      setNewProductType("WAYRA_ENI");
                      setScannedBarcode("");
                      setShowProductForm(true);
                    }}
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo ENI
                  </Button>
                  <Button
                    onClick={() => {
                      setNewProductType("WAYRA_CALAN");
                      setScannedBarcode("");
                      setShowProductForm(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo CALAN
                  </Button>
                  <Button
                    onClick={() => {
                      setNewProductType("WAYRA_OTROS");
                      setScannedBarcode("");
                      setShowProductForm(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo OTROS
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Mejorado con animaciones y responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <Card
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
                Productos ENI
              </CardTitle>
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-800">
                {stats.totalENI}
              </div>
              <p className="text-xs text-blue-600 mt-1">Productos nacionales</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">
                Productos CALAN
              </CardTitle>
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-orange-800">
                {stats.totalCALAN}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Productos importados
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">
                Productos OTROS
              </CardTitle>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-800">
                {stats.totalOTROS}
              </div>
              <p className="text-xs text-purple-600 mt-1">Productos varios</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700">
                Stock Bajo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-red-800">
                {stats.lowStock}
              </div>
              <p className="text-xs text-red-600 mt-1">Requieren reposición</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
                Valor Total
              </CardTitle>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800">
                ${stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">Inventario Wayra</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search - Mejorado responsive */}
        <Card
          className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Buscar productos Wayra..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 sm:pl-10 h-10 sm:h-12 border-0 bg-white shadow-md focus:shadow-lg transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
                <div className="flex-1 sm:max-w-xs">
                  <Dropdown
                    options={[
                      { value: "ALL", label: "Todos los productos" },
                      { value: "WAYRA_ENI", label: "Solo ENI (Nacional)" },
                      { value: "WAYRA_CALAN", label: "Solo CALAN (Importado)" },
                      { value: "WAYRA_OTROS", label: "Solo OTROS" },
                    ]}
                    value={filterType}
                    onChange={(val) =>
                      setFilterType(
                        val as
                          | "ALL"
                          | "WAYRA_ENI"
                          | "WAYRA_CALAN"
                          | "WAYRA_OTROS"
                      )
                    }
                    placeholder="Filtrar por tipo..."
                    icon={<Filter className="h-4 w-4 text-gray-500" />}
                  />
                </div>
              </div>

              {/* Botones de acción móvil */}
              {/* Botones de acción móvil - AHORA CON LOS 3 BOTONES ESPECÍFICOS */}
              <div className="flex flex-col gap-3 lg:hidden">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg h-12 text-base"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Escanear Código
                </Button>

                {canEdit && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={() => {
                        setNewProductType("WAYRA_ENI");
                        setScannedBarcode("");
                        setShowProductForm(true);
                      }}
                      className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 shadow-lg h-12 font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nuevo ENI
                    </Button>

                    <Button
                      onClick={() => {
                        setNewProductType("WAYRA_CALAN");
                        setScannedBarcode("");
                        setShowProductForm(true);
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg h-12 font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nuevo CALAN
                    </Button>

                    <Button
                      onClick={() => {
                        setNewProductType("WAYRA_OTROS");
                        setScannedBarcode("");
                        setShowProductForm(true);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg h-12 font-medium"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nuevo OTROS
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table/Cards - Vista responsive */}
        <Card
          className="shadow-2xl border-0 bg-white overflow-hidden animate-slide-up"
          style={{ animationDelay: "0.7s" }}
        >
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>Productos Wayra ({filteredProducts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Vista de tabla para desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Producto
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Tipo
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Stock
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Precios
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Código de Barras
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-110 ${
                                product.tipo === "WAYRA_ENI"
                                  ? "bg-gradient-to-br from-blue-100 to-blue-200"
                                  : product.tipo === "WAYRA_CALAN"
                                    ? "bg-gradient-to-br from-orange-100 to-orange-200"
                                    : "bg-gradient-to-br from-purple-100 to-purple-200"
                              }`}
                            >
                              {product.tipo === "WAYRA_ENI" ? (
                                <Package className="h-6 w-6 text-blue-600" />
                              ) : product.tipo === "WAYRA_CALAN" ? (
                                <Globe className="h-6 w-6 text-orange-600" />
                              ) : (
                                <Sparkles className="h-6 w-6 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {product.nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                Código: {product.codigo}
                              </div>
                              {product.descripcion && (
                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                  {product.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            className={`${
                              product.tipo === "WAYRA_ENI"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : product.tipo === "WAYRA_CALAN"
                                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                  : product.tipo === "WAYRA_OTROS"
                                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                            } transition-colors`}
                          >
                            {product.tipo === "WAYRA_ENI"
                              ? "ENI"
                              : product.tipo === "WAYRA_CALAN"
                                ? "CALAN"
                                : "OTROS"}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.tipo === "WAYRA_ENI"
                              ? "Nacional"
                              : product.tipo === "WAYRA_CALAN"
                                ? "Importado"
                                : "Varios"}
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
                                className="text-xs animate-pulse"
                              >
                                Bajo
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
                            {product.tipo === "WAYRA_CALAN" && (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-600">
                                  USD:
                                </span>
                                <span className="font-bold text-orange-600">
                                  ${product.precioCompra.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {product.codigoBarras}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowBarcodeView(product)}
                              className="p-1 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (session?.user?.role === "VENDEDOR") {
                                  setSelectedProduct({
                                    ...product,
                                    movementType: "SALIDA",
                                  });
                                } else {
                                  setSelectedProduct(product);
                                }
                                setShowMovementForm(true);
                              }}
                              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 hover:scale-105"
                              title={
                                session?.user?.role === "VENDEDOR"
                                  ? "Realizar venta"
                                  : "Movimiento de inventario"
                              }
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(product)}
                                  className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 hover:scale-105"
                                  title="Editar producto"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteProduct(product.id)}
                                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 hover:scale-105"
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

            {/* Vista de tarjetas para móvil y tablet */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
              {filteredProducts.map((product, index) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                          product.tipo === "WAYRA_ENI"
                            ? "bg-gradient-to-br from-blue-100 to-blue-200"
                            : "bg-gradient-to-br from-orange-100 to-orange-200"
                        }`}
                      >
                        {product.tipo === "WAYRA_ENI" ? (
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        ) : (
                          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {product.nombre}
                          </h3>
                          <Badge
                            className={`flex-shrink-0 text-xs ${
                              product.tipo === "WAYRA_ENI"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {product.tipo === "WAYRA_ENI"
                              ? "ENI"
                              : product.tipo === "WAYRA_CALAN"
                                ? "CALAN"
                                : "OTROS"}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          Código: {product.codigo}
                        </div>
                        {product.descripcion && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {product.descripcion}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Stock:</span>
                        <span className="text-lg sm:text-xl font-bold text-gray-900">
                          {product.stock}
                        </span>
                        {product.stock <= product.stockMinimo && (
                          <Badge
                            variant="destructive"
                            className="text-xs animate-pulse"
                          >
                            Bajo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mín: {product.stockMinimo}
                      </div>
                    </div>

                    {/* Precios */}
                    <div className="space-y-2 mb-3 pb-3 border-b">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Venta:</span>
                          <span className="font-bold text-green-600 ml-1">
                            ${product.precioVenta.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Minorista:</span>
                          <span className="font-bold text-blue-600 ml-1">
                            ${product.precioMinorista.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Mayorista:</span>
                          <span className="font-bold text-purple-600 ml-1">
                            ${product.precioMayorista.toLocaleString()}
                          </span>
                        </div>
                        {product.tipo === "WAYRA_CALAN" && (
                          <div>
                            <span className="text-gray-600">USD:</span>
                            <span className="font-bold text-orange-600 ml-1">
                              ${product.precioCompra.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Código de barras */}
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 mr-2 truncate">
                        {product.codigoBarras}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowBarcodeView(product)}
                        className="p-2 hover:bg-blue-100 transition-colors flex-shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (session?.user?.role === "VENDEDOR") {
                            setSelectedProduct({
                              ...product,
                              movementType: "SALIDA",
                            });
                          } else {
                            setSelectedProduct(product);
                          }
                          setShowMovementForm(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                      >
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        Movimiento
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProduct(product.id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 sm:py-16 px-4 animate-fade-in">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-transform duration-300">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
                </div>
                <div className="text-gray-500 text-lg sm:text-xl font-medium">
                  No se encontraron productos
                </div>
                <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
                  {searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Agrega el primer producto Wayra para comenzar"}
                </p>
                {!searchTerm && canEdit && (
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                    <Button
                      onClick={() => {
                        setNewProductType("WAYRA_ENI");
                        setShowProductForm(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Primer Producto ENI
                    </Button>
                    <Button
                      onClick={() => {
                        setNewProductType("WAYRA_CALAN");
                        setShowProductForm(true);
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Primer Producto CALAN
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {canEdit && (
        <>
          <ProductForm
            isOpen={showProductForm}
            onClose={() => {
              setShowProductForm(false);
              setScannedBarcode("");
            }}
            onSuccess={fetchProducts}
            tipo={newProductType}
            categoria={newProductType === "WAYRA_ENI" ? "ENI" : "CALAN"}
            initialBarcode={scannedBarcode}
          />

          <ProductForm
            isOpen={!!editingProduct}
            onClose={() => setEditingProduct(null)}
            onSuccess={fetchProducts}
            product={editingProduct}
            tipo={editingProduct?.tipo || "WAYRA_ENI"}
            categoria={editingProduct?.categoria || "ENI"}
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
        restrictToSales={session?.user?.role === "VENDEDOR"}
      />

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Barcode View Modal - Mejorado */}
      {showBarcodeView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl transform animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Código de Barras
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBarcodeView(null)}
                className="hover:bg-gray-100 rounded-full w-8 h-8 p-0 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="text-center">
              <h4 className="font-medium mb-2 text-gray-700 text-sm sm:text-base">
                {showBarcodeView.nombre}
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Código: {showBarcodeView.codigo}
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 rounded-xl shadow-inner">
                <BarcodeDisplay
                  value={showBarcodeView.codigoBarras}
                  productName={showBarcodeView.nombre}
                  productCode={showBarcodeView.codigo}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
