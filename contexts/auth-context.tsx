"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, loginWithEmailAndPassword, logoutUser } from "@/lib/firebase-auth"
import { useRouter } from "next/navigation"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Solo ejecutar en el cliente
    if (typeof window !== "undefined" && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)
        setLoading(false)

        // Establecer o eliminar la cookie de autenticación
        if (firebaseUser) {
          // Establecer una cookie segura con el token de Firebase
          firebaseUser.getIdToken().then((token) => {
            // Configurar la cookie para que expire en 7 días
            Cookies.set("auth", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
            })
          })
        } else {
          // Eliminar la cookie si no hay usuario
          Cookies.remove("auth")

          // Redirigir si no hay usuario autenticado
          if (window.location.pathname !== "/login") {
            router.push("/login")
          }
        }
      })

      return () => unsubscribe()
    } else {
      setLoading(false)
    }
  }, [router])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    const result = await loginWithEmailAndPassword(email, password)
    return result.user
  }

  // Función para cerrar sesión
  const logout = async () => {
    await logoutUser()
    Cookies.remove("auth") // Asegurarse de eliminar la cookie
    router.push("/login")
  }

  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted) return null

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
