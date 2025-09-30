"use client";

import { useState, useEffect } from "react";
import { set, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { error } from "console";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MECANICO";
  isActive: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

interface EditUserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "ADMIN" | "MECANICO";
  isActive: boolean;
}

export function EditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<EditUserForm>();
  const password = watch("password");

  useEffect(() => {
    if (user && isOpen) {
      setValue("name", user.name);
      setValue("email", user.email);
      setValue("role", user.role);
      setValue("isActive", user.isActive);
      setChangePassword(false);
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data: EditUserForm) => {
    if (changePassword && data.password !== data.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      };

      if (changePassword && data.password) {
        updateData.password = data.password;
      }

      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        toast.success("Usuario actualizado exitosamente");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar el usuario");
      }
    } catch (error) {
      toast.error("Error al actualizar el usuario");
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    reset();
    setChangePassword(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Editar Usuario"
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
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <Input
            {...register("email", {
              required: "El email es requerido",
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
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol de Usuario
          </label>
          <select
            {...register("role", {
              required: "El rol es obligatorio",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccionar Rol</option>
            <option value="ADMIN">Administrador</option>
            <option value="MECANICO">Mecánico</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>
        {/* Estado */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              {...register("isActive")}
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Usuario Activo
            </span>
          </label>
        </div>
        {/*Cambiar Contraseña*/}
        <div>
          <label className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Cambiar Contraseña
            </span>
          </label>
          {changePassword && (
            <div className="space-y-4">
              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    {...register(
                      "password",
                      changePassword
                        ? {
                            required: "La contraseña es requerida",
                            minLength: {
                              value: 6,
                              message:
                                "La contraseña debe tener al menos 6 caracteres",
                            },
                          }
                        : {}
                    )}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nueva Contraseña"
                    className={
                      errors.password ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    {...register(
                      "confirmPassword",
                      changePassword
                        ? {
                            required: "Confirma la contraseña",
                            validate: (value) =>
                              value === password ||
                              "Las contraseñas no coinciden",
                          }
                        : {}
                    )}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repetir contraseña"
                    className={
                      errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
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
                className="bg-blue-700 hover:bg-primary-700"
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ): null}
                {isLoading ? 'Actualizando...' : 'Actualizar Usuario'}
            </Button>
        </div>
      </form>
    </Modal>
  );
}
