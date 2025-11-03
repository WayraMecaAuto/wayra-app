"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUp,
  ArrowDown,
  Package,
  AlertCircle,
  CheckCircle,
  Info,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

interface MovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
  restrictToSales?: boolean;
}

interface MovementFormData {
  tipo: "ENTRADA" | "SALIDA";
  cantidad: string;
  motivo: string;
  precioUnitario?: string;
  tipoPrecio?: "VENTA" | "MINORISTA" | "MAYORISTA" | "MANUAL";
  precioManual?: string;
}

export function MovementForm({
  isOpen,
  onClose,
  onSuccess,
  product,
  restrictToSales = false,
}: MovementFormProps) {
  const { data: session } = useSession();
  const [tasaDolar, setTasaDolar] = useState<number>(4000);
  const [precioCompraCOP, setPrecioCompraCOP] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const response = await fetch("/api/configuracion?clave=TASA_USD_COP");
        if (response.ok) {
          const data = await response.json();
          const tasa = parseFloat(data.valor || "4000");
          setTasaDolar(tasa);

          // Calcular precio en COP si es CALAN
          if (
            product?.tipo === "WAYRA_CALAN" &&
            product?.monedaCompra === "USD"
          ) {
            setPrecioCompraCOP(product.precioCompra * tasa);
          }
        }
      } catch (error) {
        console.error("Error obteniendo tasa:", error);
      }
    };

    if (isOpen && product) {
      fetchTasa();
    }
  }, [isOpen, product]);

  const ROLES_ENTRADA = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "ADMIN_WAYRA_PRODUCTOS",
    "ADMIN_TORNI_REPUESTOS",
  ];
  const ROLES_SALIDA = [
    "SUPER_USUARIO",
    "ADMIN_WAYRA_TALLER",
    "ADMIN_WAYRA_PRODUCTOS",
    "ADMIN_TORNI_REPUESTOS",
    "VENDEDOR_WAYRA",
    "VENDEDOR_TORNI",
  ];

  const userRole = session?.user?.role || "";
  const canEnter = ROLES_ENTRADA.includes(userRole);
  const canExit = ROLES_SALIDA.includes(userRole);
  const onlySales = !canEnter || restrictToSales;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<MovementFormData>({
    defaultValues: {
      tipo: onlySales ? "SALIDA" : "ENTRADA",
      cantidad: "1",
      motivo: "",
      precioUnitario: "",
      tipoPrecio: "VENTA",
      precioManual: "",
    },
  });

  const tipo = watch("tipo");
  const cantidad = watch("cantidad");
  const tipoPrecio = watch("tipoPrecio");
  const precioManual = watch("precioManual");

  // Calcular precio de venta según el tipo seleccionado
  const getPrecioVenta = () => {
    if (tipo !== "SALIDA") return 0;

    if (tipoPrecio === "MANUAL") {
      return precioManual ? parseFloat(precioManual) : 0;
    }

    switch (tipoPrecio) {
      case "MINORISTA":
        return product.precioMinorista;
      case "MAYORISTA":
        return product.precioMayorista;
      case "VENTA":
      default:
        return product.precioVenta;
    }
  };

  const onSubmit = async (data: MovementFormData) => {
    setIsLoading(true);
    try {
      const cantidadNum = parseInt(data.cantidad);
      const precioVenta = getPrecioVenta();

      if (tipo === "SALIDA" && precioVenta <= 0) {
        toast.error("Debes ingresar un precio válido");
        setIsLoading(false);
        return;
      }

      //  Determinar la entidad contable según el tipo de producto
      let entidadContable = "WAYRA_PRODUCTOS";
      if (product.tipo === "TORNI_REPUESTO" || product.tipo === "TORNILLERIA") {
        entidadContable = "TORNIREPUESTOS";
      } else if (
        product.tipo === "WAYRA_ENI" ||
        product.tipo === "WAYRA_CALAN"
      ) {
        entidadContable = "WAYRA_PRODUCTOS";
      }

      // Para CALAN, convertir el precio de compra de USD a COP
      let precioCompraContable = product.precioCompra;
      if (product.tipo === "WAYRA_CALAN" && product.monedaCompra === "USD") {
        try {
          // Obtener tasa de cambio actual
          const tasaResponse = await fetch(
            "/api/configuracion?clave=TASA_USD_COP"
          );
          if (tasaResponse.ok) {
            const tasaData = await tasaResponse.json();
            const tasaDolar = parseFloat(tasaData.valor || "4000");
            precioCompraContable = product.precioCompra * tasaDolar;
            console.log(
              `💱 Conversión CALAN: $${product.precioCompra} USD x ${tasaDolar} = $${precioCompraContable.toFixed(2)} COP`
            );
          }
        } catch (error) {
          console.error("❌ Error obteniendo tasa de cambio:", error);
          // Usar tasa por defecto si falla
          precioCompraContable = product.precioCompra * 4000;
        }
      }

      console.log("📊 Producto:", product.nombre);
      console.log("📦 Tipo producto:", product.tipo);
      console.log("🢢 Entidad contable:", entidadContable);
      console.log("💰 Precio compra contable:", precioCompraContable);

      // 1. Crear movimiento de inventario (esto actualiza el stock automáticamente)
      const movResponse = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: product.id,
          tipo: data.tipo,
          cantidad: cantidadNum,
          motivo: data.motivo,
          precioUnitario:
            tipo === "SALIDA"
              ? precioVenta
              : data.precioUnitario && data.precioUnitario !== ""
                ? parseFloat(data.precioUnitario)
                : null,
        }),
      });

      if (!movResponse.ok) {
        const error = await movResponse.json();
        toast.error(error.error || "Error al registrar movimiento");
        setIsLoading(false);
        return;
      }

      // 2. Si es SALIDA (venta directa), registrar en contabilidad
      if (data.tipo === "SALIDA") {
        const ahora = new Date();
        const mes = ahora.getMonth() + 1;
        const anio = ahora.getFullYear();

        console.log("💰 Registrando venta en contabilidad...");
        console.log("   - Entidad:", entidadContable);
        console.log("   - Monto:", precioVenta * cantidadNum);
        console.log("   - Producto:", product.nombre);

        // Crear movimiento contable de INGRESO
        const movimientoResponse = await fetch("/api/movimientos-contables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "INGRESO",
            concepto: "VENTA_PRODUCTO",
            monto: precioVenta * cantidadNum,
            descripcion: `Venta directa: ${product.nombre} - ${data.motivo}`,
            entidad: entidadContable,
            referencia: product.id,
            mes,
            anio,
          }),
        });

        if (movimientoResponse.ok) {
          const movimientoData = await movimientoResponse.json();
          console.log("✅ Movimiento contable creado:", movimientoData.id);

          // Crear detalle de ingreso contable con precio de compra en COP
          const detalleResponse = await fetch(
            "/api/contabilidad/crear-ingreso",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productoId: product.id,
                cantidad: cantidadNum,
                precioCompra: precioCompraContable, // Usar precio convertido a COP
                precioVenta: precioVenta,
                descripcion: product.nombre,
                entidad: entidadContable,
                esDesdeOrden: false,
              }),
            }
          );

          if (detalleResponse.ok) {
            console.log("✅ Detalle contable registrado correctamente");
            if (product.tipo === "WAYRA_CALAN") {
              console.log("💱 Utilidad calculada con precio en COP");
            }
          } else {
            console.error(
              "⚠️ Error al crear detalle contable:",
              await detalleResponse.text()
            );
          }
        } else {
          console.error(
            "⚠️ Error al crear movimiento contable:",
            await movimientoResponse.text()
          );
        }
      }

      toast.success(
        `${tipo === "ENTRADA" ? "Entrada" : "Venta"} registrada exitosamente`
      );
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Error al registrar movimiento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getNewStock = () => {
    if (!cantidad || !product) return product?.stock || 0;

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum)) return product?.stock || 0;

    switch (tipo) {
      case "ENTRADA":
        return (product.stock || 0) + cantidadNum;
      case "SALIDA":
        return Math.max(0, (product.stock || 0) - cantidadNum);
      default:
        return product.stock || 0;
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Movimiento de Inventario"
      size="lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 sm:space-y-6"
      >
        {/* Información del producto */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-xl border border-blue-200">
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                {product.nombre}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Código: {product.codigo}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xs text-gray-500">
                  Tipo:{" "}
                  {product.tipo === "WAYRA_ENI"
                    ? "Wayra ENI"
                    : product.tipo === "WAYRA_CALAN"
                      ? "Wayra CALAN"
                      : product.tipo === "TORNI_REPUESTO"
                        ? "TorniRepuestos"
                        : "Tornillería"}
                </p>

                {/* ✅ MOSTRAR CONVERSIÓN PARA CALAN */}
                {product.tipo === "WAYRA_CALAN" &&
                  product.monedaCompra === "USD" && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                        💱 Costo: ${product.precioCompra.toFixed(2)} USD
                      </span>
                      <span className="text-gray-400">≈</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        ${precioCompraCOP.toLocaleString()} COP
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs sm:text-sm text-gray-600 mb-0.5">
                Stock
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {product.stock}
              </div>
            </div>
          </div>

          {/* ✅ INFORMACIÓN ADICIONAL PARA CALAN */}
          {product.tipo === "WAYRA_CALAN" && product.monedaCompra === "USD" && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-600 mb-1">Precio Compra USD</div>
                  <div className="font-bold text-orange-600">
                    ${product.precioCompra.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <div className="text-gray-600 mb-1">Tasa Actual</div>
                  <div className="font-bold text-blue-600">
                    ${tasaDolar.toLocaleString()}
                  </div>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200">
                  <div className="text-gray-700 mb-1 font-medium">
                    💰 Costo en Pesos (para contabilidad)
                  </div>
                  <div className="font-bold text-green-700 text-lg">
                    ${precioCompraCOP.toLocaleString()} COP
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tipo de movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Movimiento *
          </label>
          <div
            className={`grid ${onlySales ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-3`}
          >
            {canEnter && !restrictToSales && (
              <label className="relative cursor-pointer group">
                <input
                  {...register("tipo", { required: "Selecciona un tipo" })}
                  type="radio"
                  value="ENTRADA"
                  className="sr-only"
                />
                <div
                  className={`border-2 rounded-xl p-4 text-center transition-all ${
                    watch("tipo") === "ENTRADA"
                      ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <ArrowUp className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-lg font-bold">Entrada</div>
                  <div className="text-sm opacity-75">Agregar stock</div>
                </div>
              </label>
            )}

            {canExit && (
              <label className="relative cursor-pointer group">
                <input
                  {...register("tipo", { required: "Selecciona un tipo" })}
                  type="radio"
                  value="SALIDA"
                  className="sr-only"
                />
                <div
                  className={`border-2 rounded-xl p-4 text-center transition-all ${
                    watch("tipo") === "SALIDA"
                      ? "border-red-500 bg-gradient-to-br from-red-50 to-red-100 text-red-700 shadow-lg"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <ArrowDown className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-lg font-bold">Salida / Venta</div>
                  <div className="text-sm opacity-75">Reducir stock</div>
                </div>
              </label>
            )}
          </div>
          {errors.tipo && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.tipo.message}
            </p>
          )}
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad *
          </label>
          <Input
            {...register("cantidad", {
              required: "La cantidad es requerida",
              pattern: { value: /^\d+$/, message: "Solo números enteros" },
              validate: (value) => {
                const num = parseInt(value);
                if (num <= 0) return "La cantidad debe ser mayor a 0";
                if (tipo === "SALIDA" && num > product.stock) {
                  return `Stock insuficiente (disponible: ${product.stock})`;
                }
                return true;
              },
            })}
            type="number"
            min="1"
            placeholder="Ingresa la cantidad"
            className={`h-12 text-lg font-semibold ${errors.cantidad ? "border-red-500" : ""}`}
          />
          {errors.cantidad && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cantidad.message}
            </p>
          )}
        </div>

        {/* Precio de entrada (solo para ENTRADA) */}
        {tipo === "ENTRADA" && canEnter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Unitario Compra{" "}
              <span className="text-gray-400 text-xs">(Opcional)</span>
            </label>
            <Input
              {...register("precioUnitario")}
              type="number"
              step="50"
              placeholder="0.00"
              className="h-12 text-lg font-semibold"
            />
          </div>
        )}

        {/* Selección de precio (solo para SALIDA) */}
        {tipo === "SALIDA" && (
          <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
            <div className="flex items-center space-x-2 text-green-800">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">
                Selecciona el Precio de Venta
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Precio *
              </label>
              <select
                {...register("tipoPrecio", {
                  required: "Selecciona un tipo de precio",
                })}
                className="w-full h-12 px-4 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500"
              >
                <option value="VENTA">
                  💰 Precio Venta - ${product.precioVenta?.toLocaleString()}
                </option>
                <option value="MINORISTA">
                  🏪 Precio Minorista - $
                  {product.precioMinorista?.toLocaleString()}
                </option>
                <option value="MAYORISTA">
                  📦 Precio Mayorista - $
                  {product.precioMayorista?.toLocaleString()}
                </option>
                <option value="MANUAL">✏️ Precio Manual (personalizado)</option>
              </select>
            </div>

            {tipoPrecio === "MANUAL" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Personalizado *
                </label>
                <Input
                  {...register("precioManual", {
                    required:
                      tipoPrecio === "MANUAL" ? "Ingresa un precio" : false,
                    validate: (value) => {
                      if (tipoPrecio === "MANUAL") {
                        const precio = parseFloat(value || "0");
                        if (precio <= 0) return "El precio debe ser mayor a 0";
                      }
                      return true;
                    },
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ingresa precio personalizado"
                  className="h-12 text-lg font-semibold"
                />
                {errors.precioManual && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.precioManual.message}
                  </p>
                )}
              </div>
            )}

            {/* Mostrar precio seleccionado */}
            <div className="bg-white p-3 rounded-lg border border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Precio unitario:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ${getPrecioVenta().toLocaleString()}
                </span>
              </div>
              {cantidad && parseInt(cantidad) > 0 && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
                  <span className="text-sm font-medium text-gray-700">
                    Total venta:
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    ${(getPrecioVenta() * parseInt(cantidad)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo *
          </label>
          <Input
            {...register("motivo", { required: "El motivo es requerido" })}
            placeholder="Ej: Venta a cliente, Compra proveedor, etc."
            className={`h-12 ${errors.motivo ? "border-red-500" : ""}`}
          />
          {errors.motivo && (
            <p className="mt-1 text-sm text-red-600">{errors.motivo.message}</p>
          )}
        </div>

        {/* Preview del nuevo stock */}
        {cantidad && !isNaN(parseInt(cantidad)) && (
          <div
            className={`p-4 rounded-xl border-2 ${
              tipo === "ENTRADA"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle
                  className={`h-5 w-5 ${tipo === "ENTRADA" ? "text-green-600" : "text-red-600"}`}
                />
                <span className="font-semibold text-gray-800">
                  Nuevo Stock:
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600">Actual</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {product.stock}
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Nuevo</div>
                  <div
                    className={`text-2xl font-bold ${tipo === "ENTRADA" ? "text-green-600" : "text-red-600"}`}
                  >
                    {getNewStock()}
                  </div>
                </div>
              </div>
            </div>

            {getNewStock() <= product.stockMinimo && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-yellow-800">
                    ⚠️ Stock estará por debajo del mínimo ({product.stockMinimo}
                    )
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className={`px-6 shadow-lg ${
              tipo === "ENTRADA"
                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Registrando...
              </>
            ) : (
              `Registrar ${tipo === "ENTRADA" ? "Entrada" : "Venta"}`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
