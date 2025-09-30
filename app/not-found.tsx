import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-6xl font-bold text-primary-600 mb-4">404</h2>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Página no encontrada
        </h3>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link href="/dashboard">
          <Button>Volver al Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
