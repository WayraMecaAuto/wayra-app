// Utilidades para cálculo de precios
import { TipoProducto } from '@prisma/client'

interface PricingConfig {
  margenGanancia: number
  ivaObligatorio: boolean
  porcentajeIva: number
  conversionUSD: boolean
  descuentoMinorista: number
  descuentoMayorista: number
}

// Configuraciones por defecto que se pueden sobrescribir desde la BD
let PRICING_CONFIG: Record<string, PricingConfig> = {
  'WAYRA_ENI': {
    margenGanancia: 35,
    ivaObligatorio: false,
    porcentajeIva: 19,
    conversionUSD: false,
    descuentoMinorista: 3,
    descuentoMayorista: 10
  },
  'WAYRA_CALAN': {
    margenGanancia: 35,
    ivaObligatorio: true,
    porcentajeIva: 15,
    conversionUSD: true,
    descuentoMinorista: 3,
    descuentoMayorista: 10
  },
  'TORNILLERIA': {
    margenGanancia: 100,
    ivaObligatorio: true,
    porcentajeIva: 19,
    conversionUSD: false,
    descuentoMinorista: 5,
    descuentoMayorista: 10
  },
  'TORNI_REPUESTOS': {
    margenGanancia: 35,
    ivaObligatorio: false,
    porcentajeIva: 19,
    conversionUSD: false,
    descuentoMinorista: 2,
    descuentoMayorista: 5
  },
  'TORNI_FILTROS': {
    margenGanancia: 25,
    ivaObligatorio: false,
    porcentajeIva: 19,
    conversionUSD: false,
    descuentoMinorista: 2,
    descuentoMayorista: 4
  },
  'TORNI_LUBRICANTES': {
    margenGanancia: 15,
    ivaObligatorio: false,
    porcentajeIva: 19,
    conversionUSD: false,
    descuentoMinorista: 3,
    descuentoMayorista: 5
  }
}

// Función para actualizar configuraciones desde la BD
export async function updatePricingConfigFromDB() {
  try {
    // Importar prisma directamente para uso en servidor
    const { prisma } = await import('@/lib/db/prisma')
    const configuraciones = await prisma.configuracion.findMany()
      
    // Actualizar configuraciones dinámicamente
    configuraciones.forEach((config: any) => {
      const valor = parseFloat(config.valor)
      
      switch (config.clave) {
        case 'WAYRA_MARGEN_ENI':
          PRICING_CONFIG.WAYRA_ENI.margenGanancia = valor
          break
        case 'WAYRA_MARGEN_CALAN':
          PRICING_CONFIG.WAYRA_CALAN.margenGanancia = valor
          break
        case 'WAYRA_DESCUENTO_MINORISTA':
          PRICING_CONFIG.WAYRA_ENI.descuentoMinorista = valor
          PRICING_CONFIG.WAYRA_CALAN.descuentoMinorista = valor
          break
        case 'WAYRA_DESCUENTO_MAYORISTA':
          PRICING_CONFIG.WAYRA_ENI.descuentoMayorista = valor
          PRICING_CONFIG.WAYRA_CALAN.descuentoMayorista = valor
          break
        case 'TORNI_MARGEN_REPUESTOS':
          PRICING_CONFIG.TORNI_REPUESTOS.margenGanancia = valor
          break
        case 'TORNI_MARGEN_FILTROS':
          PRICING_CONFIG.TORNI_FILTROS.margenGanancia = valor
          break
        case 'TORNI_MARGEN_LUBRICANTES':
          PRICING_CONFIG.TORNI_LUBRICANTES.margenGanancia = valor
          break
        case 'TORNILLERIA_MARGEN':
          PRICING_CONFIG.TORNILLERIA.margenGanancia = valor
          break
        case 'TORNI_DESCUENTO_MINORISTA':
          PRICING_CONFIG.TORNI_REPUESTOS.descuentoMinorista = valor
          PRICING_CONFIG.TORNI_FILTROS.descuentoMinorista = valor
          PRICING_CONFIG.TORNI_LUBRICANTES.descuentoMinorista = valor
          break
        case 'TORNI_DESCUENTO_MAYORISTA':
          PRICING_CONFIG.TORNI_REPUESTOS.descuentoMayorista = valor
          PRICING_CONFIG.TORNI_FILTROS.descuentoMayorista = valor
          PRICING_CONFIG.TORNI_LUBRICANTES.descuentoMayorista = valor
          break
        case 'TORNILLERIA_DESCUENTO_MINORISTA':
          PRICING_CONFIG.TORNILLERIA.descuentoMinorista = valor
          break
        case 'TORNILLERIA_DESCUENTO_MAYORISTA':
          PRICING_CONFIG.TORNILLERIA.descuentoMayorista = valor
          break
        case 'IVA_CALAN':
          PRICING_CONFIG.WAYRA_CALAN.porcentajeIva = valor
          break
      }
    })
  } catch (error) {
    console.error('Error updating pricing config:', error)
  }
}

export function calculatePrices(
  precioCompra: number,
  tipo: TipoProducto,
  categoria: string,
  aplicaIva: boolean = false,
  tasaUSD: number = 4000
) {
  // Las configuraciones se cargan desde PRICING_CONFIG
  // Para actualizaciones dinámicas, usar calculatePricesAsync
  
  const configKey = tipo === 'TORNI_REPUESTO' ? `TORNI_${categoria.toUpperCase()}` : tipo
  const config = PRICING_CONFIG[configKey] || PRICING_CONFIG['TORNI_REPUESTOS']
  
  // Conversión USD a COP si aplica
  let precioBase = config.conversionUSD ? precioCompra * tasaUSD : precioCompra
  
  // Aplicar margen de ganancia
  let precioVenta = precioBase * (1 + config.margenGanancia / 100)
  
  // Aplicar IVA si es obligatorio o si se especifica
  const debeAplicarIva = config.ivaObligatorio || aplicaIva
  if (debeAplicarIva) {
    precioVenta = precioVenta * (1 + config.porcentajeIva / 100)
  }
  
  // Calcular precios minorista y mayorista
  const precioMinorista = precioVenta * (1 - config.descuentoMinorista / 100)
  const precioMayorista = precioVenta * (1 - config.descuentoMayorista / 100)
  
  return {
    precioVenta: Math.round(precioVenta),
    precioMinorista: Math.round(precioMinorista),
    precioMayorista: Math.round(precioMayorista),
    config
  }
}

export function getPricingConfig(tipo: TipoProducto, categoria: string) {
  const configKey = tipo === 'TORNI_REPUESTO' ? `TORNI_${categoria.toUpperCase()}` : tipo
  return PRICING_CONFIG[configKey] || PRICING_CONFIG['TORNI_REPUESTOS']
}

// Función para obtener configuraciones actualizadas
export function getCurrentPricingConfig() {
  return PRICING_CONFIG
}

// Versión async de calculatePrices que actualiza desde BD
export async function calculatePricesAsync(
  precioCompra: number,
  tipo: TipoProducto,
  categoria: string,
  aplicaIva: boolean = false,
  tasaUSD: number = 4000
) {
  // Actualizar configuraciones desde BD antes de calcular
  await updatePricingConfigFromDB()

  // Usar la función síncrona con las configuraciones actualizadas
  return calculatePrices(precioCompra, tipo, categoria, aplicaIva, tasaUSD)
}