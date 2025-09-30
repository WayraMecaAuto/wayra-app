'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from 'html5-qrcode'
import { Button } from './button'
import { X, Camera, Upload, AlertCircle, CheckCircle, Zap, Scan, Star, Smartphone } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
  isOpen: boolean
  title?: string
}

export function BarcodeScanner({ 
  onScan, 
  onClose, 
  isOpen, 
  title = 'Escanear Código de Barras' 
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMethod, setScanMethod] = useState<'camera' | 'file'>('camera')
  const [lastScannedCode, setLastScannedCode] = useState<string>('')
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [availableCameras, setAvailableCameras] = useState<any[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar dispositivo y navegador
  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsMobile(isMobileDevice)
    
    // Verificar permisos de cámara al iniciar
    checkCameraPermissions()
    
    // Obtener cámaras disponibles
    getCameras()
  }, [])

  useEffect(() => {
    if (isOpen && scanMethod === 'camera' && cameraPermission === 'granted') {
      initializeScanner()
    }

    return () => {
      cleanupScanner()
    }
  }, [isOpen, scanMethod, cameraPermission, selectedCamera])

  const checkCameraPermissions = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        setCameraPermission(permission.state)
        
        permission.onchange = () => {
          setCameraPermission(permission.state)
        }
      } else {
        // Para navegadores que no soportan navigator.permissions
        setCameraPermission('prompt')
      }
    } catch (error) {
      console.log('Error checking camera permissions:', error)
      setCameraPermission('prompt')
    }
  }

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      setAvailableCameras(devices)
      
      if (devices.length > 0) {
        // Preferir cámara trasera en móviles
        const backCamera = devices.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        )
        setSelectedCamera(backCamera?.id || devices[0].id)
      }
    } catch (error) {
      console.log('Error getting cameras:', error)
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      // Detener el stream inmediatamente, solo necesitábamos el permiso
      stream.getTracks().forEach(track => track.stop())
      
      setCameraPermission('granted')
      await getCameras()
      
      return true
    } catch (error) {
      console.error('Error requesting camera permission:', error)
      setCameraPermission('denied')
      setErrorMessage('Necesitas permitir el acceso a la cámara para usar esta función. Por favor, revisa la configuración de permisos de tu navegador.')
      setScanStatus('error')
      return false
    }
  }

  const initializeScanner = async () => {
    try {
      cleanupScanner()
      
      if (cameraPermission !== 'granted') {
        const granted = await requestCameraPermission()
        if (!granted) return
      }

      // Configuración básica que funciona en todos los navegadores
      const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        disableFlip: false,
        rememberLastUsedCamera: true,
        useBarCodeDetectorIfSupported: false, // Deshabilitado para mejor compatibilidad
        // Configuraciones específicas para mostrar la vista previa
        videoConstraints: {
          facingMode: isMobile ? 'environment' : 'user',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 }
        }
      }

      console.log('🎥 Inicializando scanner con configuración:', config)

      // SIEMPRE usar Html5QrcodeScanner para garantizar vista previa
      scannerRef.current = new Html5QrcodeScanner(
        'barcode-scanner',
        config,
        false // verbose = false
      )

      scannerRef.current.render(
        (decodedText) => {
          console.log('✅ Código escaneado exitosamente:', decodedText)
          handleSuccessfulScan(decodedText)
        },
        (error) => {
          // Solo loguear errores importantes, no cada frame de escaneo
          if (!error.includes('NotFoundException') && 
              !error.includes('No MultiFormat Readers') &&
              !error.includes('No code found') &&
              !error.includes('QR code parse error')) {
            console.log('Scanner error:', error)
          }
        }
      )

      setIsScanning(true)
      setScanStatus('idle')
      setErrorMessage('')
      
      // Verificar si la vista previa se cargó correctamente después de un momento
      setTimeout(() => {
        const videoElement = document.querySelector('#barcode-scanner video')
        if (videoElement) {
          console.log('✅ Vista previa de cámara cargada correctamente')
          setIsScanning(true)
        } else {
          console.warn('⚠️ No se detectó elemento de video, intentando alternativa...')
          // Intentar método alternativo si no se carga la vista previa
          initializeAlternativeScanner()
        }
      }, 2000)

    } catch (error) {
      console.error('❌ Error inicializando scanner:', error)
      handleScannerError(error)
    }
  }

  const initializeAlternativeScanner = async () => {
    try {
      console.log('🔄 Intentando método alternativo...')
      cleanupScanner()
      
      // Método alternativo usando Html5Qrcode directamente
      html5QrCodeRef.current = new Html5Qrcode('barcode-scanner')
      
      const cameraId = selectedCamera || availableCameras[0]?.id || { facingMode: isMobile ? 'environment' : 'user' }
      
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          console.log('✅ Código escaneado (método alternativo):', decodedText)
          handleSuccessfulScan(decodedText)
        },
        (error) => {
          if (!error.includes('NotFoundException') && 
              !error.includes('No MultiFormat Readers') &&
              !error.includes('No code found')) {
            console.log('Alternative scanner error:', error)
          }
        }
      )
      
      setIsScanning(true)
      console.log('✅ Método alternativo iniciado correctamente')
    } catch (altError) {
      console.error('❌ Error con método alternativo:', altError)
      handleScannerError(altError)
    }
  }

  const initializeScannerFallback = async (config: any) => {
    scannerRef.current = new Html5QrcodeScanner('barcode-scanner', config, false)

    scannerRef.current.render(
      (decodedText) => {
        console.log('✅ Código escaneado exitosamente:', decodedText)
        handleSuccessfulScan(decodedText)
      },
      (error) => {
        if (!error.includes('NotFoundException') && 
            !error.includes('No MultiFormat Readers') &&
            !error.includes('No code found')) {
          console.log('Scanner error:', error)
        }
      }
    )
    setIsScanning(true)
  }

  const handleScannerError = (error: any) => {
    let errorMsg = 'Error al inicializar la cámara.'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMsg = 'Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.'
      setCameraPermission('denied')
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMsg = 'No se encontró ninguna cámara en tu dispositivo.'
    } else if (error.name === 'NotSupportedError') {
      errorMsg = 'Tu navegador no soporta el acceso a la cámara. Intenta usar la opción de subir imagen.'
    } else if (error.name === 'OverconstrainedError') {
      errorMsg = 'La configuración de la cámara no es compatible. Intenta con una cámara diferente.'
    } else if (error.name === 'SecurityError') {
      errorMsg = 'Error de seguridad. Asegúrate de estar usando HTTPS.'
    }
    
    setErrorMessage(errorMsg)
    setScanStatus('error')
  }

  const cleanupScanner = () => {
    console.log('🧹 Limpiando scanners...')
    
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear()
          html5QrCodeRef.current = null
          console.log('✅ Html5Qrcode limpiado')
        }).catch((err) => {
          console.log('Error stopping direct scanner:', err)
          html5QrCodeRef.current = null
        })
      } catch (error) {
        console.log('Error cleaning up direct scanner:', error)
        html5QrCodeRef.current = null
      }
    }

    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        console.log('✅ Html5QrcodeScanner limpiado')
      } catch (error) {
        console.log('Error limpiando scanner:', error)
      }
      scannerRef.current = null
    }
    
    // Limpiar el contenedor del scanner
    const scannerElement = document.getElementById('barcode-scanner')
    if (scannerElement) {
      scannerElement.innerHTML = ''
    }
    
    setIsScanning(false)
  }

  const handleSuccessfulScan = (code: string) => {
    const cleanCode = code.trim()
    console.log('🎯 Procesando código:', cleanCode)
    setLastScannedCode(cleanCode)
    setScanStatus('success')
    
    // Pequeña demora para mostrar el estado de éxito
    setTimeout(() => {
      onScan(cleanCode)
      handleClose()
    }, 1200)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setScanStatus('idle')
    setErrorMessage('')
    
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor selecciona un archivo de imagen válido')
      }

      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('temp-scanner')
      
      const result = await html5QrCode.scanFile(file, false)
      console.log('🔍 Código desde archivo:', result)
      
      handleSuccessfulScan(result)
      
    } catch (error) {
      console.error('❌ Error escaneando archivo:', error)
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'No se pudo leer el código de barras de la imagen. Asegúrate de que la imagen sea clara y contenga un código de barras válido.'
      )
      setScanStatus('error')
    }

    event.target.value = ''
  }

  const handleClose = () => {
    cleanupScanner()
    setScanStatus('idle')
    setErrorMessage('')
    setLastScannedCode('')
    onClose()
  }

  const switchToCamera = async () => {
    cleanupScanner()
    setScanMethod('camera')
    setScanStatus('idle')
    setErrorMessage('')
    
    if (cameraPermission !== 'granted') {
      await requestCameraPermission()
    }
  }

  const switchToFile = () => {
    cleanupScanner()
    setScanMethod('file')
    setScanStatus('idle')
    setErrorMessage('')
  }

  const switchCamera = async (cameraId: string) => {
    console.log('📷 Cambiando cámara a:', cameraId)
    setSelectedCamera(cameraId)
    if (isScanning) {
      cleanupScanner()
      setTimeout(() => {
        initializeScanner()
      }, 1000) // Dar más tiempo para la limpieza
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[95vh] overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 overflow-y-auto max-h-[95vh]">
          {/* Header simplificado */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Scan className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isMobile ? 'Modo móvil detectado' : 'Escanea códigos de barras y QR'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isMobile && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-lg">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-700 font-medium">Móvil</span>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClose} 
                  className="hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Selección de métodos */}
          <div className="p-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex gap-2">
              <Button
                variant={scanMethod === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={switchToCamera}
                disabled={cameraPermission === 'denied'}
                className={`flex-1 h-10 ${
                  scanMethod === 'camera' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'hover:bg-blue-50'
                } ${cameraPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Camera className="h-4 w-4 mr-2" />
                {cameraPermission === 'denied' ? 'Cámara Bloqueada' : 'Usar Cámara'}
              </Button>
              <Button
                variant={scanMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={switchToFile}
                className={`flex-1 h-10 ${
                  scanMethod === 'file' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'hover:bg-emerald-50'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Imagen
              </Button>
            </div>

            {/* Selección de cámara */}
            {scanMethod === 'camera' && availableCameras.length > 1 && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Seleccionar cámara:</p>
                <div className="flex gap-2 flex-wrap">
                  {availableCameras.map((camera, index) => (
                    <Button
                      key={camera.id}
                      variant={selectedCamera === camera.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchCamera(camera.id)}
                      className={`text-xs transition-colors ${
                        selectedCamera === camera.id 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {camera.label || `Cámara ${index + 1}`}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="p-6 space-y-4">
            {/* Mensajes de estado */}
            {scanStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="text-green-800 font-semibold">
                      ¡Código escaneado exitosamente!
                    </p>
                    <p className="text-green-700 text-sm font-mono mt-1">
                      {lastScannedCode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {scanStatus === 'error' && errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-semibold">Error de escaneo</p>
                    <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                    {cameraPermission === 'denied' && (
                      <Button
                        onClick={requestCameraPermission}
                        size="sm"
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Reintentar permisos
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Área de escaneo */}
            {scanMethod === 'camera' ? (
              <div className="space-y-4">
                <div className="relative rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100">
                  <div id="barcode-scanner" className="w-full min-h-[350px]"></div>
                  {!isScanning && scanStatus !== 'error' && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <p className="text-gray-700 font-medium">
                          {cameraPermission === 'granted' ? 'Iniciando cámara...' : 'Solicitando permisos...'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          {cameraPermission === 'granted' 
                            ? 'Preparando la vista previa' 
                            : 'Permite el acceso a la cámara'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-blue-400 transition-colors bg-gray-50/30">
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 mb-4 font-medium">
                    Selecciona una imagen con código de barras
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Imagen
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Formatos soportados: JPG, PNG, GIF, BMP, WEBP
                </p>
              </div>
            )}

            {/* Instrucciones */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Instrucciones {isMobile && '(Móvil)'}:
              </h4>
              <ul className="text-sm text-blue-800 space-y-2">
                {scanMethod === 'camera' ? (
                  <>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      {isMobile 
                        ? 'Apunta la cámara trasera hacia el código'
                        : 'Apunta la cámara directamente hacia el código'}
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      Mantén el dispositivo estable con buena iluminación
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      El escaneo es automático una vez detectado
                    </li>
                    {cameraPermission !== 'granted' && (
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        Permite el acceso a la cámara cuando se solicite
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      Selecciona una imagen clara y nítida
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      El código debe estar completo y visible
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      Evita imágenes borrosas o con reflejos
                    </li>
                  </>
                )}
              </ul>
              
              {/* Consejos móviles */}
              {isMobile && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <h5 className="font-medium text-blue-800 text-sm mb-2 flex items-center">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Consejos móviles:
                  </h5>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Usa la cámara trasera para mejor calidad</li>
                    <li>• Mantén el código centrado en pantalla</li>
                    <li>• Evita mover el dispositivo durante el escaneo</li>
                    {isIOS && <li>• En Safari, permite el acceso cuando se solicite</li>}
                  </ul>
                </div>
              )}

              {/* Ayuda con permisos */}
              {cameraPermission === 'denied' && scanMethod === 'camera' && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <h5 className="font-medium text-red-800 text-sm mb-2">Cómo habilitar la cámara:</h5>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Chrome: Clic en el ícono de cámara en la barra de direcciones</li>
                    <li>• Safari: Configuración → Safari → Cámara → Permitir</li>
                    <li>• Firefox: Clic en el escudo y permite la cámara</li>
                    <li>• Móvil: Configuración → Navegador → Permisos → Cámara</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Formatos:</span>
                <span className="ml-1">EAN-13, EAN-8, CODE-128, CODE-39, UPC-A, UPC-E, QR</span>
              </div>
              <div className="flex items-center space-x-3">
                {availableCameras.length > 0 && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {availableCameras.length} cámara{availableCameras.length > 1 ? 's' : ''} disponible{availableCameras.length > 1 ? 's' : ''}
                  </span>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClose} 
                  className="hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden temp element for file scanning */}
        <div id="temp-scanner" style={{ display: 'none' }}></div>
      </div>
    </div>
  )
}