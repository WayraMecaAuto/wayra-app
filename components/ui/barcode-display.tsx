'use client'

import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Button } from '@/components/ui/button'
import { Download, Printer, Copy, Check } from 'lucide-react'

interface BarcodeDisplayProps {
  value: string
  productName?: string
  productCode?: string
  width?: number
  height?: number
}

export function BarcodeDisplay({ 
  value, 
  productName = 'Producto', 
  productCode,
  width = 2,
  height = 100 
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)
  const [copied, setCopied] = useState(false)
  const [barcodeGenerated, setBarcodeGenerated] = useState(false)

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        console.log('🔢 [BarcodeDisplay] Generando código de barras:', value)
        console.log('📏 [BarcodeDisplay] Longitud:', value.length)
        
        // Detectar el formato del código de barras
        let format = 'CODE128' // Por defecto
        
        if (/^\d+$/.test(value)) { // Solo números
          if (value.length === 13) {
            format = 'EAN13'
            console.log('✓ [BarcodeDisplay] Formato detectado: EAN-13')
          } else if (value.length === 12) {
            format = 'UPC'
            console.log('✓ [BarcodeDisplay] Formato detectado: UPC-A (12 dígitos)')
          } else if (value.length === 8) {
            format = 'EAN8'
            console.log('✓ [BarcodeDisplay] Formato detectado: EAN-8')
          } else {
            format = 'CODE128'
            console.log('✓ [BarcodeDisplay] Formato detectado: CODE128 (genérico)')
          }
        }

        // Generar código de barras con el formato correcto
        JsBarcode(barcodeRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000',
        })
        
        console.log('✅ [BarcodeDisplay] Código de barras generado exitosamente')
        setBarcodeGenerated(true)
      } catch (error) {
        console.error('❌ [BarcodeDisplay] Error al generar código de barras:', error)
        console.error('   - Valor:', value)
        console.error('   - Longitud:', value.length)
        console.error('   - Tipo:', typeof value)
        setBarcodeGenerated(false)
      }
    }
  }, [value, width, height])

  const downloadBarcode = () => {
    if (barcodeRef.current && barcodeGenerated) {
      try {
        // Convertir SVG a PNG usando canvas
        const svg = barcodeRef.current
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)
          
          const link = document.createElement('a')
          const filename = `barcode-${productName.replace(/\s+/g, '-')}-${value}.png`
          link.download = filename
          link.href = canvas.toDataURL('image/png', 1.0)
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      } catch (error) {
        console.error('Error downloading barcode:', error)
        alert('Error al descargar el código de barras')
      }
    }
  }

  const printBarcode = () => {
    if (barcodeRef.current && barcodeGenerated) {
      try {
        const svg = barcodeRef.current
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        
        const printWindow = window.open('', '_blank', 'width=600,height=400')
        
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Código de Barras - ${productName}</title>
                <style>
                  @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                  }
                  body { 
                    margin: 20px;
                    padding: 0;
                    text-align: center; 
                    font-family: 'Arial', sans-serif;
                    background: white;
                  }
                  .barcode-container { 
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 24px;
                    display: inline-block;
                    background: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    margin: 20px;
                  }
                  .product-info {
                    margin-bottom: 16px;
                    font-size: 16px;
                    color: #374151;
                    line-height: 1.5;
                  }
                  .product-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #111827;
                    margin-bottom: 8px;
                  }
                  .barcode-info {
                    margin-top: 12px;
                    font-size: 14px;
                    color: #6b7280;
                  }
                  .print-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                  }
                  .print-button:hover {
                    background: #2563eb;
                  }
                </style>
              </head>
              <body>
                <div class="barcode-container">
                  <div class="product-name">${productName}</div>
                  ${productCode && productCode !== value ? `<div class="product-info">Código Interno: ${productCode}</div>` : ''}
                  <img src="${svgUrl}" alt="Código de barras" style="max-width: 100%; height: auto;" />
                  <div class="barcode-info">
                    Código de Barras: ${value} (${value.length} dígitos)<br>
                    Generado el: ${new Date().toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div class="no-print">
                  <button class="print-button" onclick="window.print()">Imprimir Código</button>
                </div>
              </body>
            </html>
          `)
          printWindow.document.close()
          
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
            }, 100)
          }
        }
      } catch (error) {
        console.error('Error printing barcode:', error)
        alert('Error al imprimir el código de barras')
      }
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying code:', error)
      const textArea = document.createElement('textarea')
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!value) {
    return (
      <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-sm">Sin código de barras</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Información del producto */}
      {productName && (
        <div className="text-center">
          <h3 className="font-bold text-xl text-gray-900 mb-2">{productName}</h3>
          {productCode && productCode !== value && (
            <p className="text-sm text-gray-600 mb-2 bg-gray-100 px-3 py-1 rounded-lg inline-block">
              Código Interno: <span className="font-mono font-medium">{productCode}</span>
            </p>
          )}
        </div>
      )}

      {/* Código de barras */}
      <div className="barcode-container bg-white p-6 rounded-lg border-2 border-gray-200 shadow-md">
        <div className="flex justify-center">
          <svg ref={barcodeRef}></svg>
        </div>
        
        <div className="text-center mt-3 flex items-center justify-center gap-2">
          <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-1 rounded">
            {value} ({value.length} dígitos)
          </p>
          <Button
            onClick={copyCode}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-blue-50"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 text-gray-600" />
            )}
          </Button>
        </div>
      </div>

      {/* Botones de acción */}
      {barcodeGenerated && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={downloadBarcode}
            variant="outline"
            size="sm"
            className="px-4 py-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PNG
          </Button>
          <Button
            onClick={printBarcode}
            variant="outline"
            size="sm"
            className="px-4 py-2 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      )}

      {/* Mensaje de copiado */}
      {copied && (
        <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>Código copiado</span>
          </div>
        </div>
      )}
    </div>
  )
}