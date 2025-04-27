import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// Inicializar Firebase Admin solo si no está ya inicializado
const apps = getApps()

if (!apps.length) {
  // Usar las variables de entorno para la configuración
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n",
        ),
      }),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    })
    console.log("Firebase Admin inicializado correctamente")
  } catch (error) {
    console.error("Error al inicializar Firebase Admin:", error)
  }
}

// Exportar las instancias de Auth y Firestore
export const adminAuth = getAuth()
export const adminDb = getFirestore()

// Función para verificar un token de ID
export async function verifyIdToken(token: string) {
  if (!token) {
    throw new Error("No se proporcionó token")
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error("Error al verificar token:", error)
    throw error
  }
}
