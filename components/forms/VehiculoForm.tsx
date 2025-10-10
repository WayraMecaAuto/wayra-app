import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, Calendar, Palette, FileText, Gauge } from 'lucide-react'
import toast from 'react-hot-toast'

interface VehiculoFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (vehiculo: any) => void
  clienteId: string
}

interface VehiculoFormData {
  placa: string
  marca: string
  modelo: string
  año: string
  color: string
  vin: string
  motor: string
  combustible: string
  kilometraje: string
  observaciones: string
}

export function VehiculoForm({ isOpen, onClose, onSuccess, clienteId }: VehiculoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<VehiculoFormData>()

  const onSubmit = async (data: VehiculoFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clienteId
        })
      })

      if (response.ok) {
        const vehiculo = await response.json()
        toast.success('Vehículo creado exitosamente')
        onSuccess(vehiculo)
        handleClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear vehículo')
      }
    } catch (error) {
      toast.error('Error al crear vehículo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo Vehículo" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              Placa *
            </label>
            <Input
              {...register('placa', { required: 'La placa es requerida' })}
              placeholder="ABC123"
              className={errors.placa ? 'border-red-500' : ''}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.placa && (
              <p className="mt-1 text-sm text-red-600">{errors.placa.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              Año
            </label>
            <Input
              {...register('año')}
              type="number"
              placeholder="2024"
              min="1900"
              max="2100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca *
            </label>
            <Input
              {...register('marca', { required: 'La marca es requerida' })}
              placeholder="Toyota"
              className={errors.marca ? 'border-red-500' : ''}
            />
            {errors.marca && (
              <p className="mt-1 text-sm text-red-600">{errors.marca.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo *
            </label>
            <Input
              {...register('modelo', { required: 'El modelo es requerido' })}
              placeholder="Corolla"
              className={errors.modelo ? 'border-red-500' : ''}
            />
            {errors.modelo && (
              <p className="mt-1 text-sm text-red-600">{errors.modelo.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              Color
            </label>
            <Input
              {...register('color')}
              placeholder="Blanco"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-600" />
              Combustible
            </label>
            <select
              {...register('combustible')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Gas">Gas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN
            </label>
            <Input
              {...register('vin')}
              placeholder="Número de serie del vehículo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motor
            </label>
            <Input
              {...register('motor')}
              placeholder="Número de motor"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            Kilometraje
          </label>
          <Input
            {...register('kilometraje')}
            type="number"
            placeholder="150000"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            {...register('observaciones')}
            placeholder="Notas adicionales sobre el vehículo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? 'Creando...' : 'Crear Vehículo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}