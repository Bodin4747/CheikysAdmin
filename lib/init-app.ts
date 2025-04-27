// Importar la función para verificar productos
import { seedProductsIfEmpty } from "./seed-products"

export async function initializeApp() {
  try {
    console.log("Iniciando la aplicación...")

    // Verificar si existen productos
    try {
      const hasProducts = await seedProductsIfEmpty()
      if (hasProducts) {
        console.log("La aplicación ya tiene productos configurados.")
      } else {
        console.log("No se encontraron productos. Por favor, añade productos desde la interfaz de administración.")
      }
    } catch (seedError) {
      console.error("Error al verificar productos, pero la aplicación continuará:", seedError)
    }

    console.log("Aplicación inicializada correctamente")
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error)
  }
}
