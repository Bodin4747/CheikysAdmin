"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, loginWithEmailAndPassword, logoutUser } from "@/lib/firebase-auth"
import { useRouter, usePathname } from "next/navigation"
import Cookies from "js-cookie"

// Definir el tipo para el contexto
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

// Crear el contexto
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error("No implementado")
  },
  logout: async () => {
    throw new Error("No implementado")
  },
})

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext)

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Solo ejecutar en el cliente
    if (typeof window !== "undefined" && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("Estado de autenticación cambiado:", firebaseUser ? "Usuario autenticado" : "No autenticado")

        if (firebaseUser) {
          // Establecer el usuario
          setUser(firebaseUser)

          // Establecer una cookie simple para indicar que el usuario está autenticado
          Cookies.set("auth", "true", {
            expires: 7,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          })
        } else {
          // Eliminar el usuario y la cookie
          setUser(null)
          Cookies.remove("auth")

          // Redirigir si no es la página de login
          if (pathname !== "/login" && pathname !== "/crear-admin") {
            router.push("/login")
          }
        }

        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      setLoading(false)
    }
  }, [router, pathname])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      const result = await loginWithEmailAndPassword(email, password)
      return result.user
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      throw error
    }
  }

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await logoutUser()
      Cookies.remove("auth")
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted) return null

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
