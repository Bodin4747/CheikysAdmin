// Importaciones de Storage
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { app } from "./firebase"

// Inicializar Storage
const storage = getStorage(app)

// Función para subir una imagen
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error al subir imagen:", error)
    throw error
  }
}

// Función para eliminar una imagen
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
    return true
  } catch (error) {
    console.error("Error al eliminar imagen:", error)
    return false
  }
}

// Función para obtener la URL de una imagen
export async function getImageURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path)
    const url = await getDownloadURL(storageRef)
    return url
  } catch (error) {
    console.error("Error al obtener URL de imagen:", error)
    throw error
  }
}

export { storage }
