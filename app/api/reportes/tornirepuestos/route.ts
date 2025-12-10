import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = [
      "SUPER_USUARIO",
      "ADMIN_TORNI_REPUESTOS",
      "VENDEDOR_TORNI",
    ].includes(session?.user?.role || "");
    if (!session || !hasAccess) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const periodo = searchParams.get("periodo");
    const año = parseInt(
      searchParams.get("año") || String(new Date().getFullYear())
    );
    const mes = searchParams.get("mes")
      ? parseInt(searchParams.get("mes")!)
      : null;
    const trimestre = searchParams.get("trimestre")
      ? parseInt(searchParams.get("trimestre")!)
      : null;
    const semestre = searchParams.get("semestre")
      ? parseInt(searchParams.get("semestre")!)
      : null;
    const quincena = searchParams.get("quincena")
      ? parseInt(searchParams.get("quincena")!)
      : null;

    // PRODUCTOS MÁS VENDIDOS (CON FILTRO DE MES/AÑO O TODO EL TIEMPO)
    if (tipo === "productos-vendidos") {
      const mesFilter = searchParams.get("mes")
        ? parseInt(searchParams.get("mes")!)
        : null;
      const añoFilter = searchParams.get("año")
        ? parseInt(searchParams.get("año")!)
        : null;
      const quincenaFilter = searchParams.get("quincena")
        ? parseInt(searchParams.get("quincena")!)
        : null;

      let whereCondition = "";
      if (mesFilter && añoFilter) {
        whereCondition = `AND mc.mes = ${mesFilter} AND mc.anio = ${añoFilter}`;

        if (quincenaFilter) {
          if (quincenaFilter === 1) {
            whereCondition += ` AND EXTRACT(DAY FROM mc.fecha) >= 1 AND EXTRACT(DAY FROM mc.fecha) <= 15`;
          } else {
            whereCondition += ` AND EXTRACT(DAY FROM mc.fecha) >= 16`;
          }
        }
      }

      console.log("🔍 Filtrando productos TorniRepuestos:", {
        mesFilter,
        añoFilter,
        quincenaFilter,
      });

      const productosVendidos = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          p.id,
          p.nombre,
          p.categoria,
          CAST(SUM(dic.cantidad) AS INTEGER) as cantidad_vendida,
          CAST(SUM(dic."subtotalVenta") AS DECIMAL(10,2)) as total_vendido,
          CAST(SUM(dic.utilidad) AS DECIMAL(10,2)) as utilidad_total
        FROM "detalles_ingreso_contable" dic
        INNER JOIN "productos" p ON dic."productoId" = p.id
        INNER JOIN "movimientos_contables" mc ON dic."movimientoContableId" = mc.id
        WHERE mc.entidad = 'TORNIREPUESTOS'
          AND mc.tipo = 'INGRESO'
          AND p.tipo IN ('TORNI_REPUESTO', 'TORNILLERIA')
          AND p."isActive" = true
          ${whereCondition}
        GROUP BY p.id, p.nombre, p.categoria
        ORDER BY cantidad_vendida DESC
      `);

      console.log(
        "✅ TorniRepuestos - Productos vendidos:",
        productosVendidos.length,
        mesFilter ? `(Mes ${mesFilter}/${añoFilter})` : "(Todo el tiempo)"
      );

      const productosNoVendidos = await prisma.producto.findMany({
        where: {
          tipo: { in: ["TORNI_REPUESTO", "TORNILLERIA"] },
          isActive: true,
          detallesContables: {
            none: {},
          },
        },
        select: {
          id: true,
          nombre: true,
          categoria: true,
          stock: true,
          precioVenta: true,
        },
        orderBy: { stock: "desc" },
        take: 20,
      });

      console.log(
        "✅ TorniRepuestos - Productos sin ventas:",
        productosNoVendidos.length
      );

      return NextResponse.json({
        masVendidos: productosVendidos,
        menosVendidos: productosNoVendidos,
      });
    }

    // REPORTES CONTABLES POR PERIODO
    if (tipo === "contabilidad") {
      const isAdmin = ["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
        session?.user?.role || ""
      );
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      // Determinar rango de meses según el periodo
      let mesesRango: number[] = [];

      if (periodo === "quincenal" && mes && quincena) {
        mesesRango = [mes];
      } else if (periodo === "mensual" && mes) {
        mesesRango = [mes];
      } else if (periodo === "trimestral" && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1;
        mesesRango = [mesInicio, mesInicio + 1, mesInicio + 2];
      } else if (periodo === "semestral" && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7;
        mesesRango = Array.from({ length: 6 }, (_, i) => mesInicio + i);
      } else {
        // Anual - todos los meses
        mesesRango = Array.from({ length: 12 }, (_, i) => i + 1);
      }

      console.log("📅 Consultando contabilidad TorniRepuestos:", {
        periodo,
        año,
        meses: mesesRango,
      });

      // OBTENER DATOS DE CONTABILIDAD PARA CADA MES DEL RANGO
      const todosIngresos: any[] = [];
      const todosEgresos: any[] = [];

      for (const mesNum of mesesRango) {
        const ingresosMovimientos = await prisma.movimientoContable.findMany({
          where: {
            tipo: "INGRESO",
            concepto: { in: ["VENTA_PRODUCTO", "VENTA_DESDE_ORDEN"] },
            entidad: "TORNIREPUESTOS",
            mes: mesNum,
            anio: año,
          },
          include: {
            detalleIngresos: {
              include: {
                producto: {
                  select: {
                    nombre: true,
                    codigo: true,
                    categoria: true,
                  },
                },
              },
            },
          },
          orderBy: { fecha: "desc" },
        });

        const ingresosMes = ingresosMovimientos.flatMap((mov) =>
          mov.detalleIngresos.map((detalle) => ({
            id: detalle.id,
            fecha: mov.fecha,
            cantidad: detalle.cantidad,
            descripcion: detalle.producto.nombre,
            categoria: detalle.producto.categoria,
            precioCompra: detalle.precioCompra,
            precioVenta: detalle.precioVenta,
            utilidad: detalle.utilidad,
            productoId: detalle.productoId,
            motivo: mov.descripcion,
            mes: mesNum,
          }))
        );

        const egresosMes = await prisma.movimientoContable.findMany({
          where: {
            tipo: "EGRESO",
            entidad: "TORNIREPUESTOS",
            mes: mesNum,
            anio: año,
          },
          include: {
            usuario: {
              select: { name: true },
            },
          },
          orderBy: { fecha: "desc" },
        });

        const egresosFormatoMes = egresosMes.map((e) => ({
          id: e.id,
          fecha: e.fecha,
          descripcion: e.descripcion,
          concepto: e.concepto,
          usuario: e.usuario.name,
          valor: e.monto,
          mes: mesNum,
        }));

        todosIngresos.push(...ingresosMes);
        todosEgresos.push(...egresosFormatoMes);
      }

      console.log(
        "✅ TorniRepuestos - Ingresos:",
        todosIngresos.length,
        "Egresos:",
        todosEgresos.length
      );

      // CALCULAR TOTALES (EXACTAMENTE COMO EN LA API DE CONTABILIDAD)
      const totalIngresos = todosIngresos.reduce(
        (sum, i) => sum + i.precioVenta * i.cantidad,
        0
      );
      const totalCostos = todosIngresos.reduce(
        (sum, i) => sum + i.precioCompra * i.cantidad,
        0
      );
      const totalEgresos = todosEgresos.reduce((sum, e) => sum + e.valor, 0);
      const totalUtilidad = totalIngresos - totalEgresos;

      console.log("💰 Totales TorniRepuestos:", {
        ingresos: totalIngresos,
        costos: totalCostos,
        egresos: totalEgresos,
        utilidad: totalUtilidad,
      });

      // GENERAR DATOS POR PERIODO
      let porPeriodo: any[] = [];

      // QUINCENAL - NUEVO
      if (periodo === "quincenal" && mes && quincena) {
        const filtrarIngresos = todosIngresos.filter((ing) => {
          const dia = new Date(ing.fecha).getDate();
          if (quincena === 1) return dia >= 1 && dia <= 15;
          return dia >= 16 && dia <= 31;
        });

        const filtrarEgresos = todosEgresos.filter((egr) => {
          const dia = new Date(egr.fecha).getDate();
          if (quincena === 1) return dia >= 1 && dia <= 15;
          return dia >= 16 && dia <= 31;
        });

        const diasRango =
          quincena === 1 ? 15 : new Date(año, mes, 0).getDate() - 15;

        porPeriodo = Array.from({ length: diasRango }, (_, i) => {
          const dia = quincena === 1 ? i + 1 : i + 16;
          const ingresosDia = filtrarIngresos.filter(
            (ing) => new Date(ing.fecha).getDate() === dia
          );
          const egresosDia = filtrarEgresos.filter(
            (egr) => new Date(egr.fecha).getDate() === dia
          );

          const ingresosVal = ingresosDia.reduce(
            (s, i) => s + i.precioVenta * i.cantidad,
            0
          );
          const costosVal = ingresosDia.reduce(
            (s, i) => s + i.precioCompra * i.cantidad,
            0
          );
          const egresosVal = egresosDia.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: `Día ${dia}`,
            ingresos: Math.round(ingresosVal),
            costos: Math.round(costosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
          };
        });
      }
      // MENSUAL
      else if (periodo === "mensual" && mes) {
        // Agrupar por día
        const diasEnMes = new Date(año, mes, 0).getDate();
        porPeriodo = Array.from({ length: diasEnMes }, (_, i) => {
          const dia = i + 1;
          const ingresosDia = todosIngresos.filter(
            (ing) => new Date(ing.fecha).getDate() === dia
          );
          const egresosDia = todosEgresos.filter(
            (egr) => new Date(egr.fecha).getDate() === dia
          );

          const ingresosVal = ingresosDia.reduce(
            (s, i) => s + i.precioVenta * i.cantidad,
            0
          );
          const costosVal = ingresosDia.reduce(
            (s, i) => s + i.precioCompra * i.cantidad,
            0
          );
          const egresosVal = egresosDia.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: `Día ${dia}`,
            ingresos: Math.round(ingresosVal),
            costos: Math.round(costosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
          };
        });
      } else {
        // Agrupar por mes (trimestral, semestral, anual)
        porPeriodo = mesesRango.map((mesNum) => {
          const ingresosMes = todosIngresos.filter((i) => i.mes === mesNum);
          const egresosMes = todosEgresos.filter((e) => e.mes === mesNum);

          const ingresosVal = ingresosMes.reduce(
            (s, i) => s + i.precioVenta * i.cantidad,
            0
          );
          const costosVal = ingresosMes.reduce(
            (s, i) => s + i.precioCompra * i.cantidad,
            0
          );
          const egresosVal = egresosMes.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: new Date(año, mesNum - 1)
              .toLocaleString("es-CO", { month: "short" })
              .replace(".", ""),
            ingresos: Math.round(ingresosVal),
            costos: Math.round(costosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
          };
        });
      }

      console.log(
        "📊 Por periodo TorniRepuestos:",
        porPeriodo.length,
        "puntos"
      );

      return NextResponse.json({
        resumen: {
          totalIngresos: Math.round(totalIngresos),
          totalCostos: Math.round(totalCostos),
          totalEgresos: Math.round(totalEgresos),
          totalUtilidad: Math.round(totalUtilidad),
          margenUtilidad:
            totalIngresos > 0
              ? ((totalUtilidad / totalIngresos) * 100).toFixed(2)
              : "0",
        },
        porPeriodo,
        movimientos: {
          ingresos: todosIngresos.slice(0, 50),
          egresos: todosEgresos.slice(0, 50),
        },
      });
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === "comparativa") {
      const isAdmin = ["SUPER_USUARIO", "ADMIN_TORNI_REPUESTOS"].includes(
        session?.user?.role || ""
      );
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }

      const año2 = parseInt(searchParams.get("año2") || String(año - 1));

      const movimientos1 = await prisma.movimientoContable.findMany({
        where: { entidad: "TORNIREPUESTOS", anio: año },
        include: { detalleIngresos: true },
      });

      const movimientos2 = await prisma.movimientoContable.findMany({
        where: { entidad: "TORNIREPUESTOS", anio: año2 },
        include: { detalleIngresos: true },
      });

      const procesarDatos = (movs: any[]) => {
        const porMes = Array.from({ length: 12 }, (_, i) => {
          const mesNum = i + 1;
          const movsDelMes = movs.filter((m) => m.mes === mesNum);

          const ingresos = movsDelMes
            .filter((m) => m.tipo === "INGRESO")
            .reduce((s, m) => s + Number(m.monto), 0);
          const costos = movsDelMes
            .filter((m) => m.tipo === "INGRESO")
            .reduce((s, m) => {
              return (
                s +
                m.detalleIngresos.reduce(
                  (sum: number, d: any) => sum + Number(d.subtotalCompra),
                  0
                )
              );
            }, 0);
          const egresos = movsDelMes
            .filter((m) => m.tipo === "EGRESO")
            .reduce((s, m) => s + Number(m.monto), 0);
          const utilidad = ingresos - egresos;

          return { mes: mesNum, ingresos, costos, egresos, utilidad };
        });

        return {
          totalIngresos: porMes.reduce((s, m) => s + m.ingresos, 0),
          totalCostos: porMes.reduce((s, m) => s + m.costos, 0),
          totalEgresos: porMes.reduce((s, m) => s + m.egresos, 0),
          utilidadTotal: porMes.reduce((s, m) => s + m.utilidad, 0),
          porMes,
        };
      };

      const datos1 = procesarDatos(movimientos1);
      const datos2 = procesarDatos(movimientos2);

      const crecimientoIngresos =
        datos2.totalIngresos > 0
          ? (
              ((datos1.totalIngresos - datos2.totalIngresos) /
                datos2.totalIngresos) *
              100
            ).toFixed(2)
          : "0";

      const crecimientoEgresos =
        datos2.totalEgresos > 0
          ? (
              ((datos1.totalEgresos - datos2.totalEgresos) /
                datos2.totalEgresos) *
              100
            ).toFixed(2)
          : "0";

      const crecimientoUtilidad =
        datos2.utilidadTotal > 0
          ? (
              ((datos1.utilidadTotal - datos2.utilidadTotal) /
                datos2.utilidadTotal) *
              100
            ).toFixed(2)
          : "0";

      return NextResponse.json({
        año1: { año, ...datos1 },
        año2: { año: año2, ...datos2 },
        crecimiento: {
          ingresos: crecimientoIngresos,
          egresos: crecimientoEgresos,
          utilidad: crecimientoUtilidad,
        },
      });
    }

    return NextResponse.json(
      { error: "Tipo de reporte no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en reportes TorniRepuestos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
