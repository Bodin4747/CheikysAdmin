// lib/firebase-auth.ts
"use client"

import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "firebase/auth"
import { app } from "./firebase"

// Inicializamos Auth solo en el cliente
let auth

// Verificamos que estamos en el cliente antes de inicializar Auth
if (typeof window !== "undefined") {
  try {
    // Inicializamos Auth
    auth = getAuth(app)
    // Configurar persistencia local para mantener la sesión
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Firebase Auth persistencia configurada correctamente")
      })
      .catch((error) => {
        console.error("Error al configurar persistencia:", error)
      })
    console.log("Firebase Auth inicializado correctamente")
  } catch (error) {
    console.error("Error al inicializar Firebase Auth:", error)
  }
}

// Función para iniciar sesión
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth no está inicializado")
  console.log("Intentando iniciar sesión con:", email)
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    console.log("Inicio de sesión exitoso:", result.user.email)
    return result
  } catch (error: any) {
    console.error("Error en loginWithEmailAndPassword:", error.code, error.message)
    throw error
  }
}

// Función para cerrar sesión
export const logoutUser = async () => {
  if (!auth) throw new Error("Firebase Auth no está inicializado")
  return signOut(auth)
}

// Exportamos la instancia de Auth y las funciones
export { auth }
