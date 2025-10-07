'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

interface EditUserForm {
  name: string
  email: string
  password?: string
  confirmPassword?: string
  role: string
  isActive: boolean
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<EditUserForm>()
  const password = watch('password')

  useEffect(() => {
    if (user && isOpen) {
      setValue('name', user.name)
      setValue('email', user.email)
      setValue('role', user.role)
      setValue('isActive', user.isActive)
      setChangePassword(false)
    }
  }, [user, isOpen, setValue])

  const onSubmit = async (data: EditUserForm) => {
    if (changePassword && data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (!user) return

    setIsLoading(true)
    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive
      }

      if (changePassword && data.password) {
        updateData.password = data.password
      }

      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('Usuario actualizado exitosamente')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      toast.error('Error al actualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setChangePassword(false)
    onClose()
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Usuario" size="md">
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

        {/* Rol */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 transition-colors group-hover:text-blue-600">
            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <span className="text-sm sm:text-base">Rol del Usuario</span>
          </label>
          <div className="relative">
            <select
              {...register('role', { required: 'El rol es requerido' })}
              className={`w-full h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base border-2 rounded-lg focus:outline-none focus:ring-4 transition-all duration-300 appearance-none bg-white cursor-pointer ${
                errors.role 
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50' 
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300'
              }`}
            >
              <option value="SUPER_USUARIO">🔷 Super Usuario</option>
              <option value="ADMIN_WAYRA_TALLER">🔧 Admin Wayra Taller</option>
              <option value="ADMIN_WAYRA_PRODUCTOS">📦 Admin Wayra Productos</option>
              <option value="ADMIN_TORNI_REPUESTOS">⚙️ Admin TorniRepuestos</option>
              <option value="MECANICO">🔩 Mecánico</option>
              <option value="VENDEDOR_WAYRA">💼 Vendedor Wayra</option>
              <option value="VENDEDOR_TORNI">🛒 Vendedor TorniRepuestos</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-2 animate-slide-down">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Estado Activo */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:border-blue-300">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                {watch('isActive') ? (
                  <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 block">Usuario Activo</span>
                <span className="text-xs text-slate-500 hidden sm:block">Permitir acceso al sistema</span>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <input
                {...register('isActive')}
                type="checkbox"
                className="sr-only peer"
              />
              <div className="w-11 h-6 sm:w-14 sm:h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-5 sm:peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        {/* Cambiar Contraseña */}
        <div className="border-2 border-slate-200 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:border-slate-300">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-700 block">Cambiar Contraseña</span>
                <span className="text-xs text-slate-500 hidden sm:block">Actualizar credenciales de acceso</span>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 sm:w-14 sm:h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-200 rounded-full peer peer-checked:after:translate-x-5 sm:peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>

          {changePassword && (
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-slate-200 animate-slide-down">
              {/* Contraseñas en grid responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Nueva Contraseña */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      {...register('password', changePassword ? { 
                        required: 'La contraseña es requerida',
                        minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
                      } : {})}
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
                      className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center hover:scale-110 transition-transform duration-200"
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

                {/* Confirmar Nueva Contraseña */}
                <div className="group">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword', changePassword ? { 
                        required: 'Confirma la contraseña',
                        validate: value => value === password || 'Las contraseñas no coinciden'
                      } : {})}
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
                      className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center hover:scale-110 transition-transform duration-200"
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
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 sm:pt-5 border-t-2 border-slate-100">
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
                <span>Actualizando...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                Actualizar Usuario
              </span>
            )}
          </Button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        select {
          background-image: none;
        }

        select option {
          padding: 10px 12px;
        }

        /* Scroll suave para móviles */
        @media (max-width: 640px) {
          .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </Modal>
  )
}