// lib/seed-products.ts
import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"

export const seedProductsIfEmpty = async () => {
  try {
    console.log("Verificando si existen productos...")
    // Corregido: usar "productos" en lugar de "products"
    const productsRef = collection(db, "productos")
    const querySnapshot = await getDocs(productsRef)

    if (querySnapshot.empty) {
      console.log("No se encontraron productos en la base de datos.")
      return false
    } else {
      console.log(`Se encontraron ${querySnapshot.size} productos en la base de datos.`)
      return true
    }
  } catch (error) {
    console.error("Error al verificar productos:", error)
    return false
  }
}
