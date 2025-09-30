// Utilidades para códigos de barras
export function generateEAN13(): string {
  // Generar 12 dígitos aleatorios
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  // Calcular dígito de verificación
  const checkDigit = calculateEAN13CheckDigit(code);
  return code + checkDigit;
}

export function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

export function validateEAN13(code: string): boolean {
  if (code.length !== 13) return false;
  
  const checkDigit = code.slice(-1);
  const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
  
  return checkDigit === calculatedCheckDigit;
}

export function formatBarcode(code: string): string {
  // Formatear código de barras para mostrar
  return code.replace(/(\d{1})(\d{6})(\d{6})/, '$1-$2-$3');
}