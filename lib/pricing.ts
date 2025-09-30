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

const PRICING_CONFIG: Record<string, PricingConfig> = {
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

export function calculatePrices(
  precioCompra: number,
  tipo: TipoProducto,
  categoria: string,
  aplicaIva: boolean = false,
  tasaUSD: number = 4000
) {
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