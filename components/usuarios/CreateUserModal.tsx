"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "ADMIN" | "MECANICO";
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateUserForm>();
  const password = watch("password");

  const onSubmit = async (data: CreateUserForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });
      if (response.ok) {
        toast.success("Usuario creado exitosamente");
        reset();
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al crear el usuario");
      }
    } catch (error) {
      toast.error("Error al crear el usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nuevo Usuario"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo
          </label>
          <Input
            {...register("name", {
              required: "El nombre es obligatorio",
              minLength: {
                value: 2,
                message: "El nombre debe tener al menos 2 caracteres",
              },
            })}
            placeholder="Nombre Completo"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <Input
            {...register("email", {
              required: "El correo electrónico es obligatorio",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
            })}
            type="email"
            placeholder="Correo Electrónico"
            className={errors.email ? "border-red-500" : ""}
          />
            {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
        </div>
        {/* Rol */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol de Usuario
            </label>
            <select
                {...register('role', {
                    required: 'El rol es obligatorio'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryPalette-500 focus:border-transparent"
            >
                <option value="">Seleccionar Rol</option>
                <option value="ADMIN">Administrador</option>
                <option value="MECANICO">Mecánico</option>
            </select>
            {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
        </div>
        {/* Contraseña */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
            </label>
            <div className="relative">
                <Input
                    {...register('password', {
                        required: 'La contraseña es obligatoria',
                        minLength: {
                            value: 6,
                            message: 'La contraseña debe tener al menos 6 caracteres'
                        }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña"
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400"/>
                        ) : (
                        <Eye className="h-4 w-4 text-gray-400"/>
                    )}
                </button>
            </div>
            {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
        </div>
        {/* Confirmar Contraseña */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
            </label>
            <div className="relative">
                <Input
                    {...register('confirmPassword', {
                        required: 'Confirma la contraseña',
                        validate: value => value == password || 'Las contraseñas no coinciden'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmar Contraseña"
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                    {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400"/>
                        ) : (
                        <Eye className="h-4 w-4 text-gray-400"/>
                    )}
                </button>
            </div>
            {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
        </div>
        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6">
            <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
            >
                Cancelar
            </Button>
            <Button
                type="submit"
                disabled={isLoading}
                className="bg-primaryPalette-600 hover:bg-primaryPalette-700"
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                ): null}
                {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
        </div>
      </form>
    </Modal>
  );
}
