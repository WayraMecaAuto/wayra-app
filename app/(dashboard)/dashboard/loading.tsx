export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
                <p className="text-gray-600">Cargando dashboard...</p>
            </div>
        </div>
    )
}