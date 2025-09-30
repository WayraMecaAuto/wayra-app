export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        <p className="text-gray-600 text-lg">Cargando aplicación...</p>
      </div>
    </div>
  )
}