import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    lg: 'max-w-xl sm:max-w-2xl lg:max-w-4xl',
    xl: 'max-w-2xl sm:max-w-3xl lg:max-w-6xl'
  }

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md transition-all duration-300 animate-fade-in"
          onClick={onClose}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <div 
          className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full ${sizeClasses[size]} max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-modal-enter z-10 border border-gray-100`}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header con gradiente mejorado */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-blue-400/20 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-white/40 rounded-full animate-pulse-slow" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="group relative p-2 sm:p-2.5 text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300" />
              <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            </button>
          </div>

          {/* Contenido con scroll suave */}
          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(95vh-88px)] sm:max-h-[calc(90vh-96px)] scroll-smooth">
            <div className="p-4 sm:p-6 lg:p-8 animate-slide-up">
              {children}
            </div>
          </div>

          {/* Sombra inferior para indicar scroll */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-modal-enter {
          animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        /* Mejorar el scroll en móviles */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.5) transparent;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(59, 130, 246, 0.5);
          border-radius: 20px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(59, 130, 246, 0.7);
        }

        /* Prevenir bounce en iOS */
        @supports (-webkit-touch-callout: none) {
          .overflow-y-auto {
            overscroll-behavior: contain;
          }
        }
      `}</style>
    </>
  )

  return createPortal(modalContent, document.body)
}

// Componente de ejemplo para demostración
export default function ModalDemo() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [size, setSize] = React.useState<'sm' | 'md' | 'lg' | 'xl'>('md')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Demo de Modal Mejorado
          </h1>
          <p className="text-gray-600 mb-8 text-base sm:text-lg">
            Prueba el modal en diferentes tamaños y dispositivos
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setSize('sm'); setIsOpen(true) }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Modal Pequeño
              </button>
              <button
                onClick={() => { setSize('md'); setIsOpen(true) }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Modal Mediano
              </button>
              <button
                onClick={() => { setSize('lg'); setIsOpen(true) }}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Modal Grande
              </button>
              <button
                onClick={() => { setSize('xl'); setIsOpen(true) }}
                className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Modal Extra Grande
              </button>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Características:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Responsive en todas las pantallas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Animaciones suaves y modernas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Cierre con tecla Escape</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Scroll personalizado y suave</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span>Diseño elegante con gradientes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Hermoso y Funcional"
        size={size}
      >
        <div className="space-y-6">
          <div className="prose prose-blue max-w-none">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Contenido del Modal
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Este modal ha sido mejorado con un diseño moderno y responsive que se adapta perfectamente a cualquier tamaño de pantalla.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Diseño Responsive</h4>
              <p className="text-sm text-blue-700">Perfecto en móviles, tablets y desktop</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">Animaciones Fluidas</h4>
              <p className="text-sm text-purple-700">Transiciones suaves y elegantes</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-200">
            <p className="text-gray-700 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl">
              Acción Principal
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}