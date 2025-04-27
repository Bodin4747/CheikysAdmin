"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createAdminDirect } from "@/lib/create-admin-direct"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"

export default function CrearAdminPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleCreateAdmin = async () => {
    setIsCreating(true)
    try {
      const response = await createAdminDirect()
      setResult(response)
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message || "Error desconocido"}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear Usuario Administrador</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Esta página crea un usuario administrador con las siguientes credenciales:
          </p>
          <ul className="list-disc pl-5 text-gray-600">
            <li>Email: admin@cheikys.com</li>
            <li>Contraseña: admin123456</li>
          </ul>
        </div>

        <Button
          onClick={handleCreateAdmin}
          disabled={isCreating}
          className="w-full bg-amber-500 hover:bg-amber-600 mb-4"
        >
          {isCreating ? "Creando..." : "Crear Administrador"}
        </Button>

        {result && (
          <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
            <AlertDescription className="whitespace-pre-line">{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 text-center">
          <a href="/login" className="text-amber-500 hover:underline">
            Ir a la página de inicio de sesión
          </a>
        </div>
      </Card>
    </div>
  )
}
