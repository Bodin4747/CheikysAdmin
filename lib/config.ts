// lib/config.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

// Interfaz para la configuración de la impresora
export interface PrinterConfig {
  nombreImpresora: string
  direccionIP: string
  puertoIP: string
  puertoImpresora: string
  dpi: number
  anchoTicket: number
  copias: number
  cortarPapel: boolean
  imprimirCajero: boolean
  imprimirFecha: boolean
  mostrarLogo: boolean
  textoEncabezado: string
  textoPie: string
  actualizadoEn: any
}

// Interfaz para la configuración del IVA
export interface TaxConfig {
  habilitarIVA: boolean
  porcentajeIVA: number
  aplicarIVAAutomaticamente: boolean
  actualizadoEn: any
}

// Interfaz para la configuración del dólar
export interface CurrencyConfig {
  precioDolar: number
  habilitarPagosEnDolar: boolean
  actualizadoEn: any
}

// Valores por defecto para configuración de impresora
const defaultPrinterConfig: PrinterConfig = {
  nombreImpresora: "",
  direccionIP: "",
  puertoIP: "9100",
  puertoImpresora: "",
  dpi: 203,
  anchoTicket: 58,
  copias: 1,
  cortarPapel: true,
  imprimirCajero: true,
  imprimirFecha: true,
  mostrarLogo: true,
  textoEncabezado: "Cheikys Pizza\nDirección: Constitución #123\nTel: 555-123-4567",
  textoPie: "¡Gracias por su compra! Visítenos pronto",
  actualizadoEn: null,
}

// Valores por defecto para configuración de IVA
const defaultTaxConfig: TaxConfig = {
  habilitarIVA: false,
  porcentajeIVA: 16,
  aplicarIVAAutomaticamente: false,
  actualizadoEn: null,
}

// Valores por defecto para configuración del dólar
const defaultCurrencyConfig: CurrencyConfig = {
  precioDolar: 17.5,
  habilitarPagosEnDolar: true, // Cambiado a true para que esté activo por defecto
  actualizadoEn: null,
}

// Función para obtener la configuración de la impresora
export async function getPrinterConfig(): Promise<PrinterConfig> {
  try {
    const docRef = doc(db, "configuracion", "impresora")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as PrinterConfig
    } else {
      // Si no existe, crear con valores por defecto
      await setDoc(docRef, {
        ...defaultPrinterConfig,
        actualizadoEn: serverTimestamp(),
      })
      return defaultPrinterConfig
    }
  } catch (error) {
    console.error("Error al obtener configuración de impresora:", error)
    return defaultPrinterConfig
  }
}

// Función para guardar la configuración de la impresora
export async function savePrinterConfig(config: Partial<PrinterConfig>): Promise<boolean> {
  try {
    const docRef = doc(db, "configuracion", "impresora")
    await updateDoc(docRef, {
      ...config,
      actualizadoEn: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error al guardar configuración de impresora:", error)
    return false
  }
}

// Función para obtener la configuración del IVA
export async function getTaxConfig(): Promise<TaxConfig> {
  try {
    const docRef = doc(db, "configuracion", "iva")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as TaxConfig
    } else {
      // Si no existe, crear con valores por defecto
      await setDoc(docRef, {
        ...defaultTaxConfig,
        actualizadoEn: serverTimestamp(),
      })
      return defaultTaxConfig
    }
  } catch (error) {
    console.error("Error al obtener configuración de IVA:", error)
    return defaultTaxConfig
  }
}

// Función para guardar la configuración del IVA
export async function saveTaxConfig(config: Partial<TaxConfig>): Promise<boolean> {
  try {
    const docRef = doc(db, "configuracion", "iva")
    await updateDoc(docRef, {
      ...config,
      actualizadoEn: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error al guardar configuración de IVA:", error)
    return false
  }
}

// Función para obtener la configuración del dólar
export async function getCurrencyConfig(): Promise<CurrencyConfig> {
  try {
    const docRef = doc(db, "configuracion", "moneda")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as CurrencyConfig
    } else {
      // Si no existe, crear con valores por defecto
      await setDoc(docRef, {
        ...defaultCurrencyConfig,
        actualizadoEn: serverTimestamp(),
      })
      return defaultCurrencyConfig
    }
  } catch (error) {
    console.error("Error al obtener configuración de moneda:", error)
    return defaultCurrencyConfig
  }
}

// Función para guardar la configuración del dólar
export async function saveCurrencyConfig(config: Partial<CurrencyConfig>): Promise<boolean> {
  try {
    const docRef = doc(db, "configuracion", "moneda")
    await updateDoc(docRef, {
      ...config,
      actualizadoEn: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error al guardar configuración de moneda:", error)
    return false
  }
}
