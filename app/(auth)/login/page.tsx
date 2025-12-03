"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Credenciales inválidas");
      } else {
        toast.success("¡Bienvenido!");
        const session = await getSession();
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full flex flex-col justify-center space-y-6">
        {/* Header Seccion */}
        <div className="text-center animate-fade-in">
          {/* Logo Container */}
          <div className="flex justify-center items-center space-x-8 sm:space-x-12 mb-6">
            <div className="group cursor-pointer animate-slide-in-left">
              <Image
                src="/images/WayraNuevoLogo.png"
                alt="Logo de Wayra"
                width={80}
                height={80}
                className="w-20 h-20 sm:w-28 sm:h-28 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg filter drop-shadow-md"
              />
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-gray-300 animate-fade-in-delayed"></div>
            
            <div className="group cursor-pointer animate-slide-in-right">
              <Image
                src="/images/TorniRepuestos.png"
                alt="Logo de TorniRepuestos"
                width={80}
                height={80}
                className="w-20 h-20 sm:w-28 sm:h-28 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg filter drop-shadow-md"
              />
            </div>
          </div>
          
          {/* Titulo */}
          <div className="space-y-3 mb-6 animate-slide-up">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 transition-colors duration-300 hover:text-blue-700">
              Sistema de Inventario
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Wayra Y TorniRepuestos 3M
            </p>
            <div className="w-12 h-0.5 bg-blue-600 mx-auto rounded-full animate-expand"></div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 animate-slide-up-delayed transform transition-all duration-500 hover:shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="animate-fade-in-stagger">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200">
                Correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  {...register("email", {
                    required: "El correo electrónico es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "El correo electrónico no es válido",
                    },
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 transform focus:scale-[1.02] hover:border-gray-400"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 animate-shake">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña Field */}
            <div className="animate-fade-in-stagger-delayed">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 transition-colors duration-200">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: {
                      value: 6,
                      message: "La contraseña debe tener al menos 6 caracteres",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 transform focus:scale-[1.02] hover:border-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-transform duration-200 hover:scale-110"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 animate-shake">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="pt-4 animate-bounce-in">
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium text-sm transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © Wayra App. Todos los derechos reservados.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expand {
          from {
            width: 0;
          }
          to {
            width: 3rem;
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.2s both;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.7s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.7s ease-out 0.1s both;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.3s both;
        }

        .animate-slide-up-delayed {
          animation: slide-up 0.6s ease-out 0.5s both;
        }

        .animate-expand {
          animation: expand 0.8s ease-out 0.6s both;
        }

        .animate-fade-in-stagger {
          animation: fade-in 0.5s ease-out 0.7s both;
        }

        .animate-fade-in-stagger-delayed {
          animation: fade-in 0.5s ease-out 0.9s both;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out 1.1s both;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}