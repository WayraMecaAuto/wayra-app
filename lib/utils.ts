import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'USD' | 'COP' = 'COP') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function generateUniqueCode(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}${randomStr}`.toUpperCase()
}

export function generateBarcode(): string {
  // Genera código de barras de 13 digitos 
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const partial = `789${timestamp}${random}`.slice(0, 12)

  //Calcular dígito verificador
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(partial[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10

  return partial + checkDigit
}

// Conversion de USD a COP (SOLO CALAN)
export async function convertUSDtoCOP(usdAmount: number): Promise<number> {
  const exchangeRate = 4000
  return usdAmount * exchangeRate
}

// Cálcula de precios segun tipo de producto
export function calculatePrices(
  precioCompra: number,
  tipo: string,
  categoria: string,
  aplicaIva: boolean = false,
  monedaCompra: 'USD' | 'COP' = 'COP'
) {
  let precioBase = precioCompra
  
  // Conversión USD a COP solo para Calan
  if( tipo == 'WAYRA_CALAN' && monedaCompra == 'USD' ) {
    precioBase = precioCompra * 4000
  }
  let porcentajeGanancia = 35 // Por defecto
  let ivaObligatorio = false
  let porcentajeIva = 19

  switch (tipo){
    case 'WAYRA_ENI':
      porcentajeGanancia = 35
      ivaObligatorio = false
      break
    
    case 'WAYRA_CALAN':
      porcentajeGanancia = 35
      ivaObligatorio = true
      porcentajeIva = 15
      break

    case 'TORNILLERIA':
      porcentajeGanancia = 100
      ivaObligatorio = true
      porcentajeIva = 19
      break
    
    case 'TORNI_REPUESTO':
      switch (categoria){
        case 'REPUESTOS':
          porcentajeGanancia = 35
          break
        case 'FILTROS':
          porcentajeGanancia = 25
          break
        case 'LUBRICANTES':
          porcentajeGanancia = 15
          break
      }
      porcentajeIva = 19
      break
  }

  // Calcular precio de venta
  let precioVenta = precioBase * (1 + porcentajeGanancia / 100)

  // Aplicar IVA si corresponde
  if (ivaObligatorio || aplicaIva) {
    precioVenta = precioVenta * (1 + porcentajeIva / 100)
  }

  // Calcular precios minoristas y mayoristas
  let precioMinorista = precioVenta
  let precioMayorista = precioVenta

  switch (tipo){
    case 'WAYRA_ENI':
    case 'WAYRA_CALAN':
      precioMinorista = precioVenta * 0.97 //-3%
      precioMayorista = precioVenta * 0.90 //-10%
      break

    case 'TORNILLERIA':
      precioMinorista = precioVenta * 0.95 //-5%
      precioMayorista = precioVenta * 0.90 //-10%
      break
    
    case 'TORNI_REPUESTO':
      switch (categoria){
        case 'REPUESTOS':
          precioMinorista = precioVenta * 0.98 //-2%
          precioMayorista = precioVenta * 0.95 //-15%
          break
        case 'FILTROS':
          precioMinorista = precioVenta * 0.98 //-2%
          precioMayorista = precioVenta * 0.96 //-4%
          break
        case 'LUBRICANTES':
          precioMinorista = precioVenta * 0.97 //-3%
          precioMayorista = precioVenta * 0.95 //-5%
          break
      }
      break
  }
  return {
    precioVenta: Math.round(precioVenta),
    precioMinorista: Math.round(precioMinorista),
    precioMayorista: Math.round(precioMayorista),
    porcentajeGanancia,
    aplicaIvaCalculado: ivaObligatorio || aplicaIva
  }
}

export function formatTime(time: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(`2000-01-01T${time}`))
}

export function isWorkingHours(currentTime: Date = new Date()): boolean {
  const hour = currentTime.getHours()
  const day = currentTime.getDay()
  
  // Lunes a Sábado (1-6), 7:00 AM a 6:00 PM
  return day >= 1 && day <= 6 && hour >= 7 && hour < 18
}