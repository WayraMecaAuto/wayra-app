'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Dropdown from '@/components/forms/Dropdown' // Asegúrate de que la ruta sea correcta

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

const roleOptions = [
  { value: "SUPER_USUARIO", label: "Super Usuario" },
  { value: "ADMIN_WAYRA_TALLER", label: "Admin Wayra Taller" },
  { value: "ADMIN_WAYRA_PRODUCTOS", label: "Admin Wayra Productos" },
  { value: "ADMIN_TORNI_REPUESTOS", label: "Admin TorniRepuestos" },
  { value: "MECANICO", label: "Mecánico" },
  { value: "VENDEDOR_WAYRA", label: "Vendedor Wayra" },
  { value: "VENDEDOR_TORNI", label: "Vendedor TorniRepuestos" },
]

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-all duration-300">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span>Nombre Completo</span>
          </label>
          <Input
            {...register('name', { 
              required: 'El nombre es requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' }
            })}
            placeholder="Ej: Juan Pérez"
            className={`h-12 text-base border-2 rounded-xl transition-all duration-300 ${
              errors.name 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-all duration-300">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <span>Correo Electrónico</span>
          </label>
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
            className={`h-12 text-base border-2 rounded-xl transition-all duration-300 ${
              errors.email 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50' 
                : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            }`}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Rol con Dropdown personalizado */}
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-all duration-300">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <span>Rol del Usuario</span>
          </label>
          <input type="hidden" {...register('role', { required: 'El rol es requerido' })} />
          <Dropdown
            options={roleOptions}
            value={watch('role') || ''}
            onChange={(value) => setValue('role', value)}
            placeholder="Seleccionar rol..."
            icon={<Shield className="h-5 w-5 text-blue-600" />}
          />
          {errors.role && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Estado Activo */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 transition-all duration-300 hover:border-blue-400 hover:shadow-md">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                {watch('isActive') ? (
                  <ToggleRight className="h-7 w-7 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-7 w-7 text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800">Usuario Activo</p>
                <p className="text-sm text-slate-600">Permitir acceso al sistema</p>
              </div>
            </div>
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-14 h-7 bg-slate-300 rounded-full relative cursor-pointer appearance-none checked:bg-blue-600 transition-all duration-300 after:content-[''] after:absolute after:top-0.5 after:left-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-md after:transition-all checked:after:translate-x-7"
            />
          </label>
        </div>

        {/* Cambiar Contraseña */}
        <div className="border-2 border-slate-200 rounded-2xl p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <Lock className="h-7 w-7 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Cambiar Contraseña</p>
                <p className="text-sm text-slate-600">Actualizar credenciales de acceso</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
              className="w-14 h-7 bg-slate-300 rounded-full relative cursor-pointer appearance-none checked:bg-blue-600 transition-all duration-300 after:content-[''] after:absolute after:top-0.5 after:left-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-md after:transition-all checked:after:translate-x-7"
            />
          </label>

          {changePassword && (
            <div className="mt-6 pt-6 border-t-2 border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <Input
                      {...register('password', changePassword ? { 
                        required: 'La contraseña es requerida',
                        minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                      } : {})}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 pr-12 border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Contraseña</label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword', changePassword ? { 
                        required: 'Confirma la contraseña',
                        validate: value => value === password || 'Las contraseñas no coinciden'
                      } : {})}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-12 pr-12 border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t-2 border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="h-12 px-8 text-base font-medium border-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-8 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Actualizando...</span>
              </div>
            ) : (
              <span className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" />
                Actualizar Usuario
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}