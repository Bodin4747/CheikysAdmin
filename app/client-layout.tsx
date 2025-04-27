"use client"

import type React from "react"
import { useEffect } from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { AuthProvider } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { initializeApp } from "@/lib/init-app"
import ProtectedRoute from "@/components/protected-route"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login" || pathname === "/crear-admin"

  useEffect(() => {
    // Inicializar la aplicación
    initializeApp()
  }, [])

  return (
    <html lang="es">
      <head>
        <title>Cheikys Pizza - Sistema de Gestión</title>
        <meta name="description" content="Sistema de gestión para pizzería" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {isLoginPage ? (
            <main className="h-screen">{children}</main>
          ) : (
            <ProtectedRoute>
              <div className="flex h-screen overflow-hidden bg-gray-50">
                <Sidebar />
                <div className="flex flex-col flex-1 w-full">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">{children}</main>
                </div>
              </div>
            </ProtectedRoute>
          )}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
