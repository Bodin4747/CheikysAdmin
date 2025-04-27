import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc } from "firebase/firestore"
import { db } from "./firebase"

export interface Corte {
  id: string
  fecha: Date
  usuario: string
  cantidadVentas: number
  totalVentas: number
  totalEfectivo: number
  totalTarjeta: number
  totalTransferencia: number
  totalDolares?: number
  totalPesos?: number
}

// Función para realizar un corte de caja
export const realizarCorte = async (user) => {
  if (!db || !user) throw new Error("No se puede realizar el corte")

  try {
    console.log("Iniciando corte de caja...")

    // Obtener fecha de inicio y fin del día actual
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log("Rango de fechas para el corte:", today, tomorrow)

    // Consultar ventas del día que no han sido incluidas en un corte
    const ventasRef = collection(db, "ventas")
    const q = query(
      ventasRef,
      where("fecha", ">=", today),
      where("fecha", "<", tomorrow),
      where("corteDiaCerrado", "==", false),
    )

    console.log("Ejecutando consulta para corte...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas encontradas para corte:", ventasSnapshot.size)

    const ventas = ventasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`Ventas encontradas para corte: ${ventas.length}`)

    if (ventas.length === 0) {
      console.log("No hay ventas para realizar corte")
      return
    }

    // Calcular totales
    const cantidadVentas = ventas.length
    const totalVentas = ventas.reduce((sum, venta) => sum + (venta.total || 0), 0)

    // Agrupar por método de pago
    const totalEfectivo = ventas
      .filter((venta) => venta.metodoPago === "efectivo" || venta.metodoPago === "efectivo_usd")
      .reduce((sum, venta) => sum + (venta.total || 0), 0)

    const totalTarjeta = ventas
      .filter((venta) => venta.metodoPago === "tarjeta")
      .reduce((sum, venta) => sum + (venta.total || 0), 0)

    const totalTransferencia = ventas
      .filter((venta) => venta.metodoPago === "transferencia")
      .reduce((sum, venta) => sum + (venta.total || 0), 0)

    // Agrupar por moneda
    const totalDolares = ventas
      .filter((venta) => venta.isDollar === true)
      .reduce((sum, venta) => sum + (venta.total || 0), 0)

    const totalPesos = ventas.filter((venta) => !venta.isDollar).reduce((sum, venta) => sum + (venta.total || 0), 0)

    // Crear documento de corte
    const cortesRef = collection(db, "cortes")
    const corteData = {
      fecha: Timestamp.now(),
      usuario: user.email || "Usuario",
      cantidadVentas,
      totalVentas,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalDolares,
      totalPesos,
      ventasIds: ventas.map((venta) => venta.id),
    }

    console.log("Datos del corte a guardar:", corteData)
    const corteRef = await addDoc(cortesRef, corteData)
    console.log(`Corte creado con ID: ${corteRef.id}`)

    // Actualizar ventas para marcarlas como incluidas en el corte
    const batch = db.batch()

    ventas.forEach((venta) => {
      const ventaRef = doc(db, "ventas", venta.id)
      batch.update(ventaRef, {
        corteDiaCerrado: true,
        fechaCorteDia: Timestamp.now(),
        corteId: corteRef.id,
      })
    })

    await batch.commit()
    console.log("Ventas actualizadas correctamente")

    return corteRef.id
  } catch (error) {
    console.error("Error al realizar corte:", error)
    throw error
  }
}

// Función para obtener historial de cortes
export const getCortes = async () => {
  if (!db) return []

  try {
    const cortesRef = collection(db, "cortes")
    const q = query(cortesRef, orderBy("fecha", "desc"))
    const cortesSnapshot = await getDocs(q)

    return cortesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        fecha: data.fecha?.toDate() || new Date(),
        usuario: data.usuario || "Usuario",
        cantidadVentas: data.cantidadVentas || 0,
        totalVentas: data.totalVentas || 0,
        totalEfectivo: data.totalEfectivo || 0,
        totalTarjeta: data.totalTarjeta || 0,
        totalTransferencia: data.totalTransferencia || 0,
        totalDolares: data.totalDolares || 0,
        totalPesos: data.totalPesos || 0,
      }
    })
  } catch (error) {
    console.error("Error al obtener cortes:", error)
    return []
  }
}
