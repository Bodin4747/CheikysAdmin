// lib/create-admin-direct.ts
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

// Datos fijos del administrador
const ADMIN_EMAIL = "admin@cheikys.com"
const ADMIN_PASSWORD = "admin123456"

/**
 * Crea un usuario administrador directamente sin validaciones
 */
export async function createAdminDirect() {
  try {
    console.log("Creando usuario administrador...")

    // 1. Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    const uid = userCredential.user.uid

    // 2. Crear documento en Firestore
    await setDoc(doc(db, "users", uid), {
      email: ADMIN_EMAIL,
      displayName: "Administrador",
      role: "admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      message: `Usuario administrador creado con éxito.\nEmail: ${ADMIN_EMAIL}\nContraseña: ${ADMIN_PASSWORD}`,
    }
  } catch (error: any) {
    console.error("Error al crear administrador:", error)

    // Si el usuario ya existe, intentamos crear solo el documento
    if (error.code === "auth/email-already-in-use") {
      try {
        // Generar un ID único
        const uid = "admin_" + Date.now()

        // Crear solo el documento en Firestore
        await setDoc(doc(db, "users", uid), {
          email: ADMIN_EMAIL,
          displayName: "Administrador",
          role: "admin",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        return {
          success: true,
          message: `Documento de administrador creado en Firestore.\nEmail: ${ADMIN_EMAIL}\nContraseña: ${ADMIN_PASSWORD}`,
        }
      } catch (docError) {
        return {
          success: false,
          message: `Error al crear documento: ${docError}`,
        }
      }
    }

    return {
      success: false,
      message: `Error: ${error.message || error}`,
    }
  }
}
