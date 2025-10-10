import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClienteFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cliente: any) => void
}

interface ClienteFormData {
  nombre: string
  telefono: string
  email: string
  direccion: string
  tipoDocumento: string
  numeroDocumento: string
}

export function ClienteForm({ isOpen, onClose, onSuccess }: ClienteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ClienteFormData>()

  const onSubmit = async (data: ClienteFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const cliente = await response.json()
        toast.success('Cliente creado exitosamente')
        onSuccess(cliente)
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear cliente')
      }
    } catch (error) {
      toast.error('Error al crear cliente')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Cliente" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Nombre Completo *
          </label>
          <Input
            {...register('nombre', { required: 'El nombre es requerido' })}
            placeholder="Nombre del cliente"
            className={errors.nombre ? 'border-red-500' : ''}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              {...register('tipoDocumento')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento
            </label>
            <Input
              {...register('numeroDocumento')}
              placeholder="Número de documento"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              Teléfono
            </label>
            <Input
              {...register('telefono')}
              placeholder="Número de teléfono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              Email
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-600" />
            Dirección
          </label>
          <Input
            {...register('direccion')}
            placeholder="Dirección completa"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? 'Creando...' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}