'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  subtitle?: string
  icon?: React.ReactNode
}

interface SelectImprovedProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  className?: string
  error?: string
  label?: string
  required?: boolean
}

export function SelectImproved({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchable = false,
  disabled = false,
  className = '',
  error,
  label,
  required = false
}: SelectImprovedProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, searchable])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'relative w-full h-12 px-4 bg-white border-2 rounded-xl transition-all duration-200',
          'flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-200'
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <div className="flex-shrink-0">{selectedOption.icon}</div>
          )}
          <div className="flex-1 text-left min-w-0">
            {selectedOption ? (
              <>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {selectedOption.label}
                </div>
                {selectedOption.subtitle && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedOption.subtitle}
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {value && !disabled && (
            <div
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </div>
          )}
          <ChevronDown
            className={cn(
              'h-5 w-5 text-gray-400 transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-all duration-200',
                    'hover:bg-blue-50 focus:bg-blue-50 focus:outline-none hover:scale-[1.02]',
                    'flex items-center justify-between group',
                    value === option.value && 'bg-blue-50 border-l-4 border-blue-500'
                  )}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {option.icon && (
                      <div className="flex-shrink-0 transition-transform group-hover:scale-110">{option.icon}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm font-medium truncate transition-colors',
                        value === option.value ? 'text-blue-700' : 'text-gray-900'
                      )}>
                        {option.label}
                      </div>
                      {option.subtitle && (
                        <div className="text-xs text-gray-500 truncate mt-0.5 transition-colors group-hover:text-gray-600">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {value === option.value && (
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2 animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500 animate-in fade-in-0 duration-300">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}