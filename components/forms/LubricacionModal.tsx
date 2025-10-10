import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { SelectImproved } from '@/components/ui/select-improved'
import { Droplets, ListFilter as Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface LubricacionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (aceiteId: string, filtroId: string) => void
}

interface Producto {
  id: string
  nombre: string
  codigo: string
  stock: number
}

export function LubricacionModal({ isOpen, onClose, onAdd }: LubricacionModalProps) {
  const [aceites, setAceites] = useState<Producto[]>([])
  const [filtros, setFiltros] = useState<Producto[]>([])
  const [selectedAceite, setSelectedAceite] = useState('')
  const [selectedFiltro, setSelectedFiltro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchProductos()
    }
  }, [isOpen])

  const fetchProductos = async () => {
    setLoading(true)
    try {
      // Obtener aceites (lubricantes)
      const aceitesResponse = await fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=LUBRICANTES')
      if (aceitesResponse.ok) {
        const aceitesData = await aceitesResponse.json()
        setAceites(aceitesData.filter((p: any) => p.stock > 0))
      }

      // Obtener filtros
      const filtrosResponse = await fetch('/api/productos?tipo=TORNI_REPUESTO&categoria=FILTROS')
      if (filtrosResponse.ok) {
        const filtrosData = await filtrosResponse.json()
        setFiltros(filtrosData.filter((p: any) => p.stock > 0))
      }
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedAceite || !selectedFiltro) {
      toast.error('Selecciona aceite y filtro para el servicio')
      return
    }

    onAdd(selectedAceite, selectedFiltro)
    handleClose()
    toast.success('Servicio de lubricación agregado')
  }

  const handleClose = () => {
    setSelectedAceite('')
    setSelectedFiltro('')
    onClose()
  }

  const aceiteOptions = aceites.map(aceite => ({
    value: aceite.id,
    label: aceite.nombre,
    subtitle: `Stock: ${aceite.stock} - Código: ${aceite.codigo}`,
    icon: <Droplets className="h-4 w-4 text-blue-600" />
  }))

  const filtroOptions = filtros.map(filtro => ({
    value: filtro.id,
    label: filtro.nombre,
    subtitle: `Stock: ${filtro.stock} - Código: ${filtro.codigo}`,
    icon: <Filter className="h-4 w-4 text-green-600" />
  }))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Servicio de Lubricación" size="md">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Servicio de Lubricación</h4>
          <p className="text-sm text-blue-600">
            Este servicio requiere seleccionar el aceite y filtro específicos que se utilizarán.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando productos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aceite a Utilizar *
              </label>
              <SelectImproved
                options={aceiteOptions}
                value={selectedAceite}
                onChange={setSelectedAceite}
                placeholder="Seleccionar aceite..."
                searchable
                error={!selectedAceite ? 'Selecciona un aceite' : undefined}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtro de Aceite a Utilizar *
              </label>
              <SelectImproved
                options={filtroOptions}
                value={selectedFiltro}
                onChange={setSelectedFiltro}
                placeholder="Seleccionar filtro..."
                searchable
                error={!selectedFiltro ? 'Selecciona un filtro' : undefined}
              />
            </div>

            {selectedAceite && selectedFiltro && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h5 className="font-medium text-green-800 mb-2">Productos Seleccionados:</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Aceite:</span>
                    <span className="font-medium">{aceites.find(a => a.id === selectedAceite)?.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Filtro:</span>
                    <span className="font-medium">{filtros.find(f => f.id === selectedFiltro)?.nombre}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedAceite || !selectedFiltro || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Agregar Servicio
          </Button>
        </div>
      </div>
    </Modal>
  )
}