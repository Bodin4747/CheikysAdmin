"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/crear-admin"]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route) || false)

    // Si no está cargando, no hay usuario y no es una ruta pública, redirigir al login
    if (!loading && !user && !isPublicRoute) {
      console.log("No autenticado, redirigiendo a login desde:", pathname)
      router.push("/login")
    }
  }, [loading, user, router, pathname])

  // Si está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Si no hay usuario y no es una ruta pública, no renderizar nada
  if (!user && !publicRoutes.some((route) => pathname?.startsWith(route) || false)) {
    return null
  }

  // Si hay usuario o es una ruta pública, renderizar el contenido
  return <>{children}</>
}
