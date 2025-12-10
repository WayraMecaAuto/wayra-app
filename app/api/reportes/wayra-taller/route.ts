import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const hasAccess = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_TALLER",
      "MECANICO",
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

    // Verificar permisos para contabilidad
    const canViewContabilidad = [
      "SUPER_USUARIO",
      "ADMIN_WAYRA_TALLER",
    ].includes(session?.user?.role || "");

    // SERVICIOS MÁS/MENOS REALIZADOS
    if (tipo === "servicios-frecuencia") {
      const filtrarPorMes = searchParams.get("mes")
        ? parseInt(searchParams.get("mes")!)
        : null;
      const filtrarPorAño = searchParams.get("año")
        ? parseInt(searchParams.get("año")!)
        : null;
      const filtrarPorQuincena = searchParams.get("quincena")
        ? parseInt(searchParams.get("quincena")!)
        : null;

      let queryCondition = "";
      if (filtrarPorMes && filtrarPorAño) {
        queryCondition = `AND os.mes = ${filtrarPorMes} AND os.anio = ${filtrarPorAño}`;

        if (filtrarPorQuincena) {
          if (filtrarPorQuincena === 1) {
            queryCondition += ` AND EXTRACT(DAY FROM os."fechaFin") >= 1 AND EXTRACT(DAY FROM os."fechaFin") <= 15`;
          } else {
            queryCondition += ` AND EXTRACT(DAY FROM os."fechaFin") >= 16`;
          }
        }
      }

      const servicios = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          so.descripcion,
          COUNT(*) as veces_realizado,
          SUM(so.precio) as ingreso_total,
          AVG(so.precio) as precio_promedio
        FROM "servicios_orden" so
        INNER JOIN "ordenes_servicio" os ON so."ordenId" = os.id
        WHERE os.estado = 'COMPLETADO' ${queryCondition}
        GROUP BY so.descripcion
        ORDER BY veces_realizado DESC
      `);

      // Normalizar descripciones de lubricación
      const serviciosAgrupados = servicios.reduce((acc: any[], serv: any) => {
        let descripcion = serv.descripcion.trim();
        if (
          descripcion.toLowerCase().includes("lubricación") ||
          descripcion.toLowerCase().includes("lubricacion")
        ) {
          descripcion = "Lubricación";
        }

        const existente = acc.find((s) => s.descripcion === descripcion);
        if (existente) {
          existente.veces_realizado += parseInt(serv.veces_realizado);
          existente.ingreso_total += parseFloat(serv.ingreso_total);
        } else {
          acc.push({
            descripcion,
            veces_realizado: parseInt(serv.veces_realizado),
            ingreso_total: parseFloat(serv.ingreso_total),
            precio_promedio: parseFloat(serv.precio_promedio),
          });
        }
        return acc;
      }, []);

      serviciosAgrupados.sort((a, b) => b.veces_realizado - a.veces_realizado);

      return NextResponse.json({
        masRealizados: serviciosAgrupados,
        menosRealizados: serviciosAgrupados.slice(-10).reverse(),
      });
    }

    // PRODUCTIVIDAD POR MECÁNICO
    if (tipo === "mecanicos-productividad") {
      let whereClause: any = {
        estado: "COMPLETADO",
        anio: año,
      };

      // Filtrar por periodo
      if (periodo === "quincenal" && mes && quincena) {
        // NUEVO
        whereClause.mes = mes;
        // La condición de días se aplica más abajo en las órdenes
      } else if (periodo === "mensual" && mes) {
        whereClause.mes = mes;
      } else if (periodo === "trimestral" && trimestre) {
        const mesInicio = (trimestre - 1) * 3 + 1;
        const mesFin = trimestre * 3;
        whereClause.mes = { gte: mesInicio, lte: mesFin };
      } else if (periodo === "semestral" && semestre) {
        const mesInicio = semestre === 1 ? 1 : 7;
        const mesFin = semestre === 1 ? 6 : 12;
        whereClause.mes = { gte: mesInicio, lte: mesFin };
      }

      const mecanicos = await prisma.user.findMany({
        where: { role: "MECANICO", isActive: true },
        select: { id: true, name: true },
      });

      const productividad = await Promise.all(
        mecanicos.map(async (mecanico) => {
          let ordenes = await prisma.ordenServicio.findMany({
            where: {
              ...whereClause,
              mecanicoId: mecanico.id,
            },
            include: {
              servicios: true,
            },
          });

          // NUEVO: Filtrar por quincena si es necesario
          if (periodo === "quincenal" && quincena) {
            ordenes = ordenes.filter((orden) => {
              const fechaUsar = orden.fechaFin || orden.fechaCreacion;
              const dia = new Date(fechaUsar).getDate();
              if (quincena === 1) {
                return dia >= 1 && dia <= 15;
              } else {
                return dia >= 16;
              }
            });
          }

          const totalOrdenes = ordenes.length;
          const totalIngresos = ordenes.reduce((sum, o) => sum + o.total, 0);
          const utilidadTotal = ordenes.reduce((sum, o) => sum + o.utilidad, 0);

          // Calcular tiempo promedio
          const ordenesConTiempo = ordenes.filter(
            (o) => o.fechaInicio && o.fechaFin
          );
          const tiempoPromedio =
            ordenesConTiempo.length > 0
              ? ordenesConTiempo.reduce((sum, o) => {
                  const inicio = new Date(o.fechaInicio!).getTime();
                  const fin = new Date(o.fechaFin!).getTime();
                  return sum + (fin - inicio) / (1000 * 60 * 60); // Horas
                }, 0) / ordenesConTiempo.length
              : 0;

          return {
            mecanico: mecanico.name,
            mecanicoId: mecanico.id,
            totalOrdenes,
            totalIngresos,
            utilidadTotal,
            tiempoPromedioHoras: tiempoPromedio.toFixed(2),
            ingresoPromedioPorOrden:
              totalOrdenes > 0
                ? (totalIngresos / totalOrdenes).toFixed(2)
                : "0",
          };
        })
      );

      // Ordenar por total de órdenes
      productividad.sort((a, b) => b.totalOrdenes - a.totalOrdenes);

      return NextResponse.json({
        productividad,
        mecanicoDelMes: productividad[0] || null,
      });
    }

    // REPORTES CONTABLES
    if (tipo === "contabilidad") {
      if (!canViewContabilidad) {
        return NextResponse.json(
          { error: "Sin permisos para ver contabilidad" },
          { status: 403 }
        );
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

      console.log("📅 Consultando contabilidad Wayra Taller:", {
        periodo,
        año,
        meses: mesesRango,
      });

      // OBTENER DATOS DE CADA MES
      const todosIngresos: any[] = [];
      const todosEgresos: any[] = [];

      for (const mesNum of mesesRango) {
        // Obtener órdenes completadas del mes
        const ordenesCompletadas = await prisma.ordenServicio.findMany({
          where: {
            estado: "COMPLETADO",
            mes: mesNum,
            anio: año,
          },
          include: {
            servicios: true,
            repuestosExternos: true,
            cliente: {
              select: { nombre: true },
            },
            vehiculo: {
              select: { placa: true, marca: true, modelo: true },
            },
          },
          orderBy: { fechaFin: "desc" },
        });

        ordenesCompletadas.forEach((orden) => {
          // SERVICIOS
          orden.servicios.forEach((servicio) => {
            todosIngresos.push({
              id: servicio.id,
              fecha: orden.fechaFin || orden.fechaCreacion,
              descripcion: `${servicio.descripcion} - Orden ${orden.numeroOrden}`,
              monto: servicio.precio,
              tipo: "SERVICIO",
              ordenId: orden.id,
              mes: mesNum,
            });
          });

          // REPUESTOS EXTERNOS (solo estos van a Wayra Taller)
          orden.repuestosExternos.forEach((repuesto) => {
            todosIngresos.push({
              id: repuesto.id,
              fecha: orden.fechaFin || orden.fechaCreacion,
              descripcion: `${repuesto.nombre} - Orden ${orden.numeroOrden}`,
              monto: repuesto.subtotal,
              utilidad: repuesto.utilidad,
              tipo: "REPUESTO_EXTERNO",
              ordenId: orden.id,
              mes: mesNum,
            });
          });

          // MANO DE OBRA
          if (orden.manoDeObra && orden.manoDeObra > 0) {
            todosIngresos.push({
              id: `mo-${orden.id}`,
              fecha: orden.fechaFin || orden.fechaCreacion,
              descripcion: `Mano de obra - Orden ${orden.numeroOrden}`,
              monto: orden.manoDeObra,
              tipo: "MANO_OBRA",
              ordenId: orden.id,
              mes: mesNum,
            });
          }
        });

        // Obtener egresos del mes
        const egresosMes = await prisma.movimientoContable.findMany({
          where: {
            tipo: "EGRESO",
            entidad: "WAYRA",
            mes: mesNum,
            anio: año,
          },
          include: {
            usuario: {
              select: {
                name: true,
                role: true,
              },
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
          rol: e.usuario.role,
          valor: e.monto,
          mes: mesNum,
        }));

        todosEgresos.push(...egresosFormatoMes);
      }

      console.log(
        "✅ Wayra Taller - Ingresos:",
        todosIngresos.length,
        "Egresos:",
        todosEgresos.length
      );

      // CALCULAR TOTALES
      const totalIngresos = todosIngresos.reduce((s, i) => s + i.monto, 0);
      const totalEgresos = todosEgresos.reduce((s, e) => s + e.valor, 0);
      const utilidadNeta = totalIngresos - totalEgresos;

      console.log("💰 Totales Wayra Taller:", {
        ingresos: totalIngresos,
        egresos: totalEgresos,
        utilidadNeta,
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

          const ingresosVal = ingresosDia.reduce((s, i) => s + i.monto, 0);
          const egresosVal = egresosDia.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: `Día ${dia}`,
            mes: mes,
            ingresos: Math.round(ingresosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
            ordenes: ingresosDia.filter((i) => i.tipo === "SERVICIO").length,
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

          const ingresosVal = ingresosDia.reduce((s, i) => s + i.monto, 0);
          const egresosVal = egresosDia.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: `Día ${dia}`,
            mes: mes,
            ingresos: Math.round(ingresosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
            ordenes: ingresosDia.filter((i) => i.tipo === "SERVICIO").length,
          };
        });
      } else {
        // Agrupar por mes (trimestral, semestral, anual)
        porPeriodo = mesesRango.map((mesNum) => {
          const ingresosMes = todosIngresos.filter((i) => i.mes === mesNum);
          const egresosMes = todosEgresos.filter((e) => e.mes === mesNum);

          const ingresosVal = ingresosMes.reduce((s, i) => s + i.monto, 0);
          const egresosVal = egresosMes.reduce((s, e) => s + e.valor, 0);

          return {
            periodo: new Date(año, mesNum - 1)
              .toLocaleString("es-CO", { month: "short" })
              .replace(".", ""),
            mes: mesNum,
            ingresos: Math.round(ingresosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
            ordenes: ingresosMes.filter((i) => i.tipo === "SERVICIO").length,
          };
        });
      }

      console.log("📊 Por periodo Wayra Taller:", porPeriodo.length, "puntos");

      return NextResponse.json({
        resumen: {
          totalIngresos: Math.round(totalIngresos),
          totalEgresos: Math.round(totalEgresos),
          utilidadNeta: Math.round(utilidadNeta),
          margenUtilidad:
            totalIngresos > 0
              ? ((utilidadNeta / totalIngresos) * 100).toFixed(2)
              : "0",
          totalOrdenes: todosIngresos.filter((i) => i.tipo === "SERVICIO")
            .length,
        },
        porPeriodo,
        egresos: todosEgresos.slice(0, 50),
      });
    }

    // COMPARATIVA AÑO VS AÑO
    if (tipo === "comparativa") {
      if (!canViewContabilidad) {
        return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
      }

      const año2 = parseInt(searchParams.get("año2") || String(año - 1));

      // Procesar datos de cada año
      const procesarDatosAnio = async (anioTarget: number) => {
        const todosIngresos: any[] = [];
        const todosEgresos: any[] = [];

        for (let mesNum = 1; mesNum <= 12; mesNum++) {
          // Obtener órdenes completadas
          const ordenesCompletadas = await prisma.ordenServicio.findMany({
            where: {
              estado: "COMPLETADO",
              mes: mesNum,
              anio: anioTarget,
            },
            include: {
              servicios: true,
              repuestosExternos: true,
            },
          });

          ordenesCompletadas.forEach((orden) => {
            const ingresoOrden =
              orden.servicios.reduce((s, serv) => s + serv.precio, 0) +
              orden.repuestosExternos.reduce((s, r) => s + r.subtotal, 0) +
              (orden.manoDeObra || 0);

            todosIngresos.push({
              monto: ingresoOrden,
              mes: mesNum,
            });
          });

          // Obtener egresos
          const egresosMes = await prisma.movimientoContable.findMany({
            where: {
              tipo: "EGRESO",
              entidad: "WAYRA",
              mes: mesNum,
              anio: anioTarget,
            },
          });

          todosEgresos.push(
            ...egresosMes.map((e) => ({
              valor: e.monto,
              mes: mesNum,
            }))
          );
        }

        // Calcular por mes
        const porMes = Array.from({ length: 12 }, (_, i) => {
          const mesNum = i + 1;
          const ingresosMes = todosIngresos.filter((ing) => ing.mes === mesNum);
          const egresosMes = todosEgresos.filter((egr) => egr.mes === mesNum);

          const ingresosVal = ingresosMes.reduce((s, i) => s + i.monto, 0);
          const egresosVal = egresosMes.reduce((s, e) => s + e.valor, 0);

          return {
            mes: mesNum,
            ingresos: Math.round(ingresosVal),
            egresos: Math.round(egresosVal),
            utilidad: Math.round(ingresosVal - egresosVal),
            ordenes: ingresosMes.length,
          };
        });

        return {
          totalIngresos: porMes.reduce((s, m) => s + m.ingresos, 0),
          totalEgresos: porMes.reduce((s, m) => s + m.egresos, 0),
          utilidadTotal: porMes.reduce((s, m) => s + m.utilidad, 0),
          totalOrdenes: porMes.reduce((s, m) => s + m.ordenes, 0),
          porMes,
        };
      };

      const datos1 = await procesarDatosAnio(año);
      const datos2 = await procesarDatosAnio(año2);

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

      const crecimientoOrdenes =
        datos2.totalOrdenes > 0
          ? (
              ((datos1.totalOrdenes - datos2.totalOrdenes) /
                datos2.totalOrdenes) *
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
          ordenes: crecimientoOrdenes,
        },
      });
    }

    return NextResponse.json(
      { error: "Tipo de reporte no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en reportes Wayra Taller:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
