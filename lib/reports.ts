// lib/reports.ts
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { format } from "date-fns"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

// Define the Sale type
export interface Sale {
  id: string
  fecha: Date
  nombreCliente: string
  telefono?: string
  total: number
  metodoPago: string
  isDollar?: boolean
  productos: any[]
}

// Interfaz para estadísticas de productos
export interface ProductStats {
  id: string
  nombre: string
  cantidad: number
  total: number
  categoria: string
  tipo: string
}

// Interfaz para estadísticas de tamaños
export interface SizeStats {
  size: string
  cantidad: number
  total: number
}

// Función para obtener estadísticas de productos por categoría
export const getProductStatsByCategory = async (startDate: Date, endDate: Date, categoria?: string) => {
  try {
    console.log("Obteniendo estadísticas de productos por categoría:", categoria || "todas")
    console.log("Rango de fechas:", startDate, endDate)

    // Ajustar la fecha final para incluir todo el día
    const endDateAdjusted = new Date(endDate)
    endDateAdjusted.setHours(23, 59, 59, 999)

    // Primero, obtener todas las ventas sin filtros para verificar que hay datos
    const ventasRef = collection(db, "ventas")
    const checkQuery = query(ventasRef)

    console.log("Verificando si hay ventas en la colección...")
    const checkSnapshot = await getDocs(checkQuery)
    console.log(`Total de documentos en la colección ventas: ${checkSnapshot.size}`)

    if (checkSnapshot.size > 0) {
      // Imprimir estructura del primer documento para depuración
      const primerDoc = checkSnapshot.docs[0].data()
      console.log("Estructura del primer documento:", JSON.stringify(primerDoc, null, 2))

      // Verificar si el campo fecha existe y su tipo
      if (primerDoc.fecha) {
        console.log("Tipo de campo fecha:", typeof primerDoc.fecha)
        console.log("¿Es timestamp?", primerDoc.fecha instanceof Timestamp)
      } else {
        console.log("El campo fecha no existe en el documento")
      }
    }

    // Ahora intentar la consulta con filtro de fechas
    // IMPORTANTE: No usar filtros de fecha si hay problemas con el formato
    let q = query(ventasRef)

    // Solo aplicar filtros de fecha si estamos seguros del formato
    if (checkSnapshot.size > 0 && checkSnapshot.docs[0].data().fecha instanceof Timestamp) {
      console.log("Aplicando filtros de fecha...")
      q = query(ventasRef, where("fecha", ">=", startDate), where("fecha", "<=", endDateAdjusted))
    } else {
      console.log("ADVERTENCIA: No se aplican filtros de fecha debido a problemas con el formato")
    }

    console.log("Ejecutando consulta para estadísticas de productos...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas encontradas:", ventasSnapshot.size)

    // Si no hay ventas, retornar array vacío
    if (ventasSnapshot.empty) {
      console.log("No se encontraron ventas en el rango de fechas")
      return []
    }

    // Mapa para acumular estadísticas por producto
    const productMap = new Map()

    // Procesar cada venta
    ventasSnapshot.docs.forEach((doc) => {
      const venta = doc.data()
      console.log(`Procesando venta ${doc.id}, productos:`, venta.productos?.length || 0)

      const productos = venta.productos || []

      productos.forEach((producto) => {
        // Usar el tipo como categoría si no hay categoría explícita
        const productoCategoria = producto.categoria || producto.tipo || "Sin categoría"

        // Si se especificó una categoría, filtrar por ella (comparando con tipo o categoría)
        if (categoria && productoCategoria.toLowerCase() !== categoria.toLowerCase()) {
          return
        }

        const id = producto.id || ""
        const nombre = producto.nombre || ""
        const precio = producto.precio || 0
        const cantidad = producto.cantidad || 1
        const subtotal = producto.subtotal || precio * cantidad
        const tipo = producto.tipo || "Sin tipo"

        console.log(
          `Producto encontrado: ${nombre}, cantidad: ${cantidad}, categoría: ${productoCategoria}, tipo: ${tipo}`,
        )

        if (productMap.has(id)) {
          const current = productMap.get(id)
          productMap.set(id, {
            ...current,
            cantidad: current.cantidad + cantidad,
            total: current.total + subtotal,
          })
        } else {
          productMap.set(id, {
            id,
            nombre,
            precio,
            categoria: productoCategoria,
            tipo,
            cantidad,
            total: subtotal,
          })
        }
      })
    })

    // Convertir a array y ordenar por cantidad
    const products = Array.from(productMap.values())
    products.sort((a, b) => b.cantidad - a.cantidad)

    console.log(`Productos de categoría ${categoria || "todas"} procesados:`, products.length)
    console.log("Productos procesados:", JSON.stringify(products, null, 2))
    return products
  } catch (error) {
    console.error("Error al obtener estadísticas de productos por categoría:", error)
    console.error("Detalles del error:", error.message, error.stack)
    return []
  }
}

// Función para obtener estadísticas de tamaños de pizza
export const getPizzaSizeStats = async (startDate: Date, endDate: Date) => {
  try {
    console.log("Obteniendo estadísticas de tamaños de pizza")
    console.log("Rango de fechas:", startDate, endDate)

    // Ajustar la fecha final para incluir todo el día
    const endDateAdjusted = new Date(endDate)
    endDateAdjusted.setHours(23, 59, 59, 999)

    // Primero, obtener todas las ventas sin filtros para verificar que hay datos
    const ventasRef = collection(db, "ventas")
    const checkQuery = query(ventasRef)

    console.log("Verificando si hay ventas en la colección...")
    const checkSnapshot = await getDocs(checkQuery)
    console.log(`Total de documentos en la colección ventas: ${checkSnapshot.size}`)

    // Ahora intentar la consulta con filtro de fechas
    // IMPORTANTE: No usar filtros de fecha si hay problemas con el formato
    let q = query(ventasRef)

    // Solo aplicar filtros de fecha si estamos seguros del formato
    if (checkSnapshot.size > 0 && checkSnapshot.docs[0].data().fecha instanceof Timestamp) {
      console.log("Aplicando filtros de fecha...")
      q = query(ventasRef, where("fecha", ">=", startDate), where("fecha", "<=", endDateAdjusted))
    } else {
      console.log("ADVERTENCIA: No se aplican filtros de fecha debido a problemas con el formato")
    }

    console.log("Ejecutando consulta para tamaños de pizza...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas encontradas:", ventasSnapshot.size)

    // Si no hay ventas, retornar array vacío
    if (ventasSnapshot.empty) {
      console.log("No se encontraron ventas en el rango de fechas")
      return []
    }

    // Mapa para acumular estadísticas por tamaño
    const sizeMap = new Map()

    // Procesar cada venta
    ventasSnapshot.docs.forEach((doc) => {
      const venta = doc.data()
      console.log(`Procesando venta ${doc.id} para tamaños, productos:`, venta.productos?.length || 0)

      const productos = venta.productos || []

      productos.forEach((producto) => {
        // Solo procesar productos con tamaño (pizzas) - usar tamanio en lugar de size
        if (producto.tamanio || producto.size) {
          const size = producto.tamanio || producto.size
          console.log(`Producto con tamaño encontrado: ${producto.nombre}, tamaño: ${size}`)

          const cantidad = producto.cantidad || 1
          const subtotal = producto.subtotal || 0

          if (sizeMap.has(size)) {
            const current = sizeMap.get(size)
            sizeMap.set(size, {
              ...current,
              cantidad: current.cantidad + cantidad,
              total: current.total + subtotal,
            })
          } else {
            sizeMap.set(size, {
              size,
              cantidad,
              total: subtotal,
            })
          }
        }
      })
    })

    // Convertir a array y ordenar por cantidad
    const sizes = Array.from(sizeMap.values())
    sizes.sort((a, b) => b.cantidad - a.cantidad)

    console.log("Tamaños de pizza procesados:", sizes.length)
    console.log("Datos de tamaños:", JSON.stringify(sizes, null, 2))
    return sizes
  } catch (error) {
    console.error("Error al obtener estadísticas de tamaños de pizza:", error)
    console.error("Detalles del error:", error.message, error.stack)
    return []
  }
}

// Función para obtener ventas por rango de fechas
export const getSalesByDateRange = async (startDate, endDate, paymentMethod) => {
  try {
    console.log("Obteniendo ventas por rango de fechas")
    console.log("Rango:", startDate, endDate)
    console.log("Método de pago:", paymentMethod || "todos")

    // Convertir fechas a objetos Date si son strings
    const start = typeof startDate === "string" ? new Date(startDate) : startDate
    const end = typeof endDate === "string" ? new Date(endDate) : endDate

    // Ajustar la fecha final para incluir todo el día
    end.setHours(23, 59, 59, 999)

    // Primero, obtener todas las ventas sin filtros para verificar que hay datos
    const ventasRef = collection(db, "ventas")
    const checkQuery = query(ventasRef)

    console.log("Verificando si hay ventas en la colección...")
    const checkSnapshot = await getDocs(checkQuery)
    console.log(`Total de documentos en la colección ventas: ${checkSnapshot.size}`)

    // Construir la consulta
    let q = query(ventasRef)

    // Solo aplicar filtros de fecha si estamos seguros del formato
    if (checkSnapshot.size > 0 && checkSnapshot.docs[0].data().fecha instanceof Timestamp) {
      console.log("Aplicando filtros de fecha...")

      // Filtrar por método de pago si se especifica
      if (paymentMethod && paymentMethod !== "todos") {
        q = query(
          ventasRef,
          where("fecha", ">=", start),
          where("fecha", "<=", end),
          where("metodoPago", "==", paymentMethod),
        )
      } else {
        q = query(ventasRef, where("fecha", ">=", start), where("fecha", "<=", end))
      }
    } else {
      console.log("ADVERTENCIA: No se aplican filtros de fecha debido a problemas con el formato")

      // Filtrar solo por método de pago si se especifica
      if (paymentMethod && paymentMethod !== "todos") {
        q = query(ventasRef, where("metodoPago", "==", paymentMethod))
      }
    }

    console.log("Ejecutando consulta para ventas por rango de fechas...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas encontradas:", ventasSnapshot.size)

    // Procesar resultados
    const ventas = ventasSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(),
        nombreCliente: data.nombreCliente || "Cliente",
        clientPhone: data.telefono || "N/A",
        total: data.total || 0,
        metodoPago: data.metodoPago || "efectivo",
        isDollar: data.isDollar || false,
        productos: data.productos || [],
      }
    })

    // Calcular totales
    const total = ventas.reduce((sum, venta) => sum + venta.total, 0)

    // Agrupar por método de pago
    const byPaymentMethod = {
      efectivo: ventas.filter((venta) => venta.metodoPago === "efectivo").reduce((sum, venta) => sum + venta.total, 0),
      tarjeta: ventas.filter((venta) => venta.metodoPago === "tarjeta").reduce((sum, venta) => sum + venta.total, 0),
      transferencia: ventas
        .filter((venta) => venta.metodoPago === "transferencia")
        .reduce((sum, venta) => sum + venta.total, 0),
    }

    // Agrupar por moneda
    const byDollar = {
      dollar: ventas.filter((venta) => venta.isDollar).reduce((sum, venta) => sum + venta.total, 0),
      peso: ventas.filter((venta) => !venta.isDollar).reduce((sum, venta) => sum + venta.total, 0),
    }

    console.log("Resumen de ventas:", {
      count: ventas.length,
      total,
      byPaymentMethod,
      byDollar,
    })

    return {
      count: ventas.length,
      total,
      byPaymentMethod,
      byDollar,
      items: ventas,
    }
  } catch (error) {
    console.error("Error al obtener ventas por rango de fechas:", error)
    console.error("Detalles del error:", error.message, error.stack)
    return {
      count: 0,
      total: 0,
      byPaymentMethod: {},
      byDollar: {},
      items: [],
    }
  }
}

// Funciones para exportar datos

// Exportar a Excel
export const exportToExcel = (data, filename) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    alert("Error al exportar a Excel")
  }
}

// Exportar a PDF
export const exportToPDF = (data, title, filename) => {
  try {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(title, 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30)

    // Tabla
    doc.autoTable({
      startY: 40,
      head: [Object.keys(data[0])],
      body: data.map((item) => Object.values(item)),
      theme: "striped",
      headStyles: { fillColor: [255, 180, 0] },
    })

    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    alert("Error al exportar a PDF")
  }
}

// Formatear datos de ventas para exportación
export const formatSalesForExport = (sales) => {
  return sales.map((sale) => ({
    Fecha: format(sale.fecha, "dd/MM/yyyy HH:mm"),
    Cliente: sale.nombreCliente || "Cliente",
    Teléfono: sale.clientPhone || "N/A",
    Total: sale.total,
    "Método de Pago": sale.metodoPago,
    Moneda: sale.isDollar ? "Dólares" : "Pesos",
    Productos: sale.productos?.length || 0,
  }))
}

// Formatear datos de productos para exportación
export const formatProductStatsForExport = (products) => {
  return products.map((product) => ({
    Producto: product.nombre,
    Categoría: product.categoria || "Sin categoría",
    "Unidades Vendidas": product.cantidad,
    "Total Vendido": product.total,
  }))
}
