// Utilidades para códigos de barras
// Utilidades para códigos de barras
export function generateEAN13(): string {
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  
  const checkDigit = calculateEAN13CheckDigit(code);
  return code + checkDigit;
}

//Calcula el dígito verificador para EAN-13
export function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

//Valida si un código EAN-13 tiene el dígito verificador correcto
export function validateEAN13(code: string): boolean {
  if (code.length !== 13 || !/^\d+$/.test(code)) return false;
  
  const checkDigit = code.slice(-1);
  const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
  
  return checkDigit === calculatedCheckDigit;
}

//Valida si un código UPC-A (12 dígitos) es válido
export function validateUPCA(code: string): boolean {
  if (code.length !== 12 || !/^\d+$/.test(code)) return false;
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(code[11]);
}

// Valida si un código EAN-8 (8 dígitos) es válido
export function validateEAN8(code: string): boolean {
  if (code.length !== 8 || !/^\d+$/.test(code)) return false;
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return checkDigit === parseInt(code[7]);
}

/**
 * VALIDACIÓN PRINCIPAL: Acepta códigos de 6 a 20 dígitos
 * @param code - Código de barras a validar
 * @returns Object con validez, formato detectado y mensaje
 */
export function validateBarcode(code: string): {
  isValid: boolean;
  format: string;
  message: string;
} {
  // Validación 1: Verificar que no esté vacío
  if (!code || code.trim().length === 0) {
    return {
      isValid: false,
      format: 'NONE',
      message: 'El código de barras no puede estar vacío'
    };
  }

  const cleanCode = code.trim();

  // Validación 2: Longitud entre 6 y 20 caracteres
  if (cleanCode.length < 6 || cleanCode.length > 20) {
    return {
      isValid: false,
      format: 'INVALID_LENGTH',
      message: `Código debe tener entre 6 y 20 caracteres (actual: ${cleanCode.length})`
    };
  }

  // Validación 3: Solo números
  if (!/^\d+$/.test(cleanCode)) {
    return {
      isValid: false,
      format: 'NON_NUMERIC',
      message: 'El código debe contener solo números'
    };
  }

  // Detectar formato y validar si es estándar
  let format = 'CUSTOM';
  let message = 'Código personalizado válido';

  if (cleanCode.length === 13) {
    const isValidEAN13 = validateEAN13(cleanCode);
    format = isValidEAN13 ? 'EAN-13' : 'EAN-13_INVALID';
    message = isValidEAN13 
      ? 'EAN-13 válido' 
      : 'EAN-13 con dígito verificador incorrecto (se acepta igual)';
  } else if (cleanCode.length === 12) {
    const isValidUPCA = validateUPCA(cleanCode);
    format = isValidUPCA ? 'UPC-A' : 'UPC-A_INVALID';
    message = isValidUPCA 
      ? 'UPC-A válido' 
      : 'UPC-A con dígito verificador incorrecto (se acepta igual)';
  } else if (cleanCode.length === 8) {
    const isValidEAN8 = validateEAN8(cleanCode);
    format = isValidEAN8 ? 'EAN-8' : 'EAN-8_INVALID';
    message = isValidEAN8 
      ? 'EAN-8 válido' 
      : 'EAN-8 con dígito verificador incorrecto (se acepta igual)';
  } else if (cleanCode.length >= 6 && cleanCode.length <= 20) {
    format = `CUSTOM_${cleanCode.length}`;
    message = `Código personalizado de ${cleanCode.length} dígitos`;
  }

  return {
    isValid: true,
    format,
    message
  };
}