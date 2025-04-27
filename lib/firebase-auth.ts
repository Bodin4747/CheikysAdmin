// lib/firebase-auth.ts
"use client"

import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { app } from "./firebase"

// Inicializamos Auth solo en el cliente
let auth

// Verificamos que estamos en el cliente antes de inicializar Auth
if (typeof window !== "undefined") {
  try {
    // Inicializamos Auth
    auth = getAuth(app)
    console.log("Firebase Auth inicializado correctamente")
  } catch (error) {
    console.error("Error al inicializar Firebase Auth:", error)
  }
}

// Función para iniciar sesión
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth no está inicializado")
  return signInWithEmailAndPassword(auth, email, password)
}

// Función para cerrar sesión
export const logoutUser = async () => {
  if (!auth) throw new Error("Firebase Auth no está inicializado")
  return signOut(auth)
}

// Exportamos la instancia de Auth y las funciones
export { auth }
