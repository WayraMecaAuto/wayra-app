'use client'

import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Button } from './button'
import { Download, Printer, Copy, Check } from 'lucide-react'

interface BarcodeDisplayProps {
  value: string
  width?: number
  height?: number
  displayValue?: boolean
  showDownload?: boolean
  productName?: string
  productCode?: string
  className?: string
}

export function BarcodeDisplay({ 
  value, 
  width = 2, 
  height = 80, 
  displayValue = true,
  showDownload = true,
  productName = 'Producto',
  productCode,
  className = ''
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [barcodeGenerated, setBarcodeGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (canvasRef.current && value) {
      setIsLoading(true)
      try {
        // Limpiar canvas primero
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        // Determinar el formato del código de barras
        let format = 'CODE128'
        if (value.length === 13 && /^\d+$/.test(value)) {
          format = 'EAN13'
        } else if (value.length === 12 && /^\d+$/.test(value)) {
          format = 'EAN13' // JsBarcode puede manejar EAN12 como EAN13
        } else if (value.length === 8 && /^\d+$/.test(value)) {
          format = 'EAN8'
        }

        JsBarcode(canvas, value, {
          format,
          width,
          height,
          displayValue,
          fontSize: 12,
          textMargin: 8,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10,
          textAlign: 'center',
          textPosition: 'bottom',
          font: 'monospace'
        })
        
        setBarcodeGenerated(true)
      } catch (error) {
        console.error('Error generating barcode:', error)
        setBarcodeGenerated(false)
        
        // Mostrar mensaje de error en el canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.font = '14px Arial'
            ctx.fillStyle = '#dc2626'
            ctx.textAlign = 'center'
            ctx.fillText('Error generando código', canvasRef.current.width / 2, 30)
            ctx.fillText(`Código: ${value}`, canvasRef.current.width / 2, 50)
          }
        }
      } finally {
        setTimeout(() => setIsLoading(false), 300)
      }
    }
  }, [value, width, height, displayValue])

  const downloadBarcode = () => {
    if (canvasRef.current && barcodeGenerated) {
      try {
        const link = document.createElement('a')
        const filename = `barcode-${productName.replace(/\s+/g, '-')}-${value}.png`
        link.download = filename
        link.href = canvasRef.current.toDataURL('image/png', 1.0)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        console.error('Error downloading barcode:', error)
        alert('Error al descargar el código de barras')
      }
    }
  }

  const printBarcode = () => {
    if (canvasRef.current && barcodeGenerated) {
      try {
        const dataUrl = canvasRef.current.toDataURL('image/png', 1.0)
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
                  <img src="${dataUrl}" alt="Código de barras" style="max-width: 100%; height: auto;" />
                  <div class="barcode-info">
                    Código de Barras: ${value}<br>
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
          
          // Auto-print después de cargar
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
      // Fallback para navegadores que no soportan clipboard API
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
      <div className="flex items-center justify-center p-12 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border-2 border-dashed border-gray-300 transition-all duration-300 hover:border-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center opacity-50">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No hay código de barras para mostrar</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-6 ${className} animate-in fade-in-0 duration-500`}>
      {/* Información del producto */}
      <div className="text-center">
        <h3 className="font-bold text-xl text-gray-900 mb-2 animate-in slide-in-from-top-2 duration-500 delay-100">{productName}</h3>
        {productCode && productCode !== value && (
          <p className="text-sm text-gray-600 mb-3 animate-in slide-in-from-top-2 duration-500 delay-200 bg-gray-100 px-3 py-1 rounded-lg inline-block">
            Código Interno: <span className="font-mono font-medium">{productCode}</span>
          </p>
        )}
        <div className="flex items-center justify-center gap-3 animate-in slide-in-from-top-2 duration-500 delay-300">
          <span className="text-sm text-gray-600 bg-slate-100 px-3 py-2 rounded-lg font-mono tracking-wide">
            {value}
          </span>
          <Button
            onClick={copyCode}
            variant="ghost"
            size="sm"
            className="group h-8 w-8 p-0 hover:bg-blue-50 hover:scale-110 transition-all duration-200 rounded-lg"
          >
            <div className={`transition-all duration-300 ${copied ? 'scale-110' : 'scale-100'}`}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600 animate-in zoom-in-50 duration-200" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Canvas del código de barras */}
      <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-4 duration-500 delay-200">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-sm text-gray-600 animate-pulse">Generando código...</p>
            </div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className={`block mx-auto transition-all duration-500 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {barcodeGenerated && !isLoading && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 hover:opacity-100 transition-all duration-300 pointer-events-none"></div>
        )}
      </div>

      {/* Botones de acción */}
      {showDownload && barcodeGenerated && (
        <div className="flex flex-wrap justify-center gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-400">
          <Button
            onClick={downloadBarcode}
            variant="outline"
            size="sm"
            className="group px-6 py-3 h-auto border-2 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-300 rounded-xl"
          >
            <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
            <span className="font-medium">Descargar PNG</span>
          </Button>
          <Button
            onClick={printBarcode}
            variant="outline"
            size="sm"
            className="group px-6 py-3 h-auto border-2 hover:border-green-400 hover:bg-green-50 hover:text-green-700 hover:scale-105 hover:shadow-lg transition-all duration-300 rounded-xl"
          >
            <Printer className="h-4 w-4 mr-2 group-hover:animate-pulse" />
            <span className="font-medium">Imprimir</span>
          </Button>
        </div>
      )}

      {/* Mensaje de estado */}
      {copied && (
        <div className="text-sm text-green-700 bg-green-100 px-4 py-2 rounded-xl border border-green-200 animate-in slide-in-from-bottom-2 duration-300 shadow-sm">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Código copiado al portapapeles</span>
          </div>
        </div>
      )}
    </div>
  )
}