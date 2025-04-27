"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-amber-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <img src="/cheikys-logo.png" alt="Cheikys Pizza Logo" className="w-full h-full animate-pulse" />
          </div>
          <p className="text-amber-600 animate-pulse">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
