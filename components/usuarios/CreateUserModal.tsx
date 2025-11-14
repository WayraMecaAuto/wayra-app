'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Dropdown from '@/components/forms/Dropdown' 

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateUserForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: string
}

const roleOptions = [
  { value: "SUPER_USUARIO", label: "Super Usuario" },
  { value: "ADMIN_WAYRA_TALLER", label: "Admin Wayra Taller" },
  { value: "ADMIN_WAYRA_PRODUCTOS", label: "Admin Wayra Productos" },
  { value: "ADMIN_TORNI_REPUESTOS", label: "Admin TorniRepuestos" },
  { value: "MECANICO", label: "Mecánico" },
  { value: "VENDEDOR_WAYRA", label: "Vendedor Wayra" },
  { value: "VENDEDOR_TORNI", label: "Vendedor TorniRepuestos" },
]

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue, getValues } = useForm<CreateUserForm>({
    defaultValues: { role: "" }
  })
  const password = watch('password')

  const onSubmit = async (data: CreateUserForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role
        })
      })

      if (response.ok) {
        toast.success('Usuario creado exitosamente')
        reset()
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear usuario')
      }
    } catch (error) {
      toast.error('Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Nuevo Usuario" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {/* Nombre */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <span className="text-sm sm:text-base">Nombre Completo</span>
          </label>
          <div className="relative">
            <Input
              {...register('name', { 
                required: 'El nombre es requerido',
                minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
              })}
              placeholder="Ej: Juan Pérez"
              className={`h-10 sm:h-11 text-sm sm:text-base transition-all duration-300 border-2 ${
                errors.name 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                  : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-slate-300'
              }`}
            />
            {errors.name && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            )}
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
              <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <span className="text-sm sm:text-base">Correo Electrónico</span>
          </label>
          <div className="relative">
            <Input
              {...register('email', { 
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              type="email"
              placeholder="usuario@wayra.com"
              className={`h-10 sm:h-11 text-sm sm:text-base transition-all duration-300 border-2 ${
                errors.email 
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                  : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-slate-300'
              }`}
            />
            {errors.email && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Rol con Dropdown personalizado */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <span className="text-sm sm:text-base">Rol del Usuario</span>
          </label>

          <input
            type="hidden"
            {...register('role', { required: 'El rol es requerido' })}
          />

          <Dropdown
            options={roleOptions}
            value={getValues('role') || ""}
            onChange={(value) => setValue('role', value, { shouldValidate: true })}
            placeholder="Seleccionar rol"
            icon={<Shield className="h-4 w-4 text-blue-600 opacity-70" />}
          />

          {errors.role && (
            <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Contraseña */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
              <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <span className="text-sm sm:text-base">Contraseña</span>
            </label>
            <div className="relative">
              <Input
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className={`h-10 sm:h-11 text-sm sm:text-base pr-10 sm:pr-12 transition-all duration-300 border-2 ${
                  errors.password 
                    ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center hover:scale-110 transition-transform duration-200 z-10"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-blue-600 transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-blue-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
              <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
              <span className="text-sm sm:text-base">Confirmar Contraseña</span>
            </label>
            <div className="relative">
              <Input
                {...register('confirmPassword', { 
                  required: 'Confirma la contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repetir contraseña"
                className={`h-10 sm:h-11 text-sm sm:text-base pr-10 sm:pr-12 transition-all duration-300 border-2 ${
                  errors.confirmPassword 
                    ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center hover:scale-110 transition-transform duration-200 z-10"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-blue-600 transition-colors" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-blue-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 sm:pt-5 border-t-2 border-slate-100 mt-5 sm:mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base px-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creando...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Crear Usuario
              </span>
            )}
          </Button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </Modal>
  )
}