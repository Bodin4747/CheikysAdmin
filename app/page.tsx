"use client"

import { useState, useEffect } from "react"
import AdminDashboard from "@/components/admin-dashboard"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Mostrar el dashboard para todos los usuarios
  return <AdminDashboard />
}
