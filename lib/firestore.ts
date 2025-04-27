import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
  orderBy,
  serverTimestamp,
  addDoc,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "./firebase"

// Define the User type
interface User {
  id: string
  email: string
  displayName: string
  role: "admin" | "cashier" | "employee" | "owner"
  createdAt: any // Timestamp
  updatedAt: any // Timestamp
}

// Define the Product type
interface Product {
  id: string
  nombre: string
  precio?: number
  descripcion: string
  categoria: string
  imagenURL: string
  disponible: boolean
  tipo: string
  tipoSalsa?: string
  numeroRollos?: number
  tieneExtras?: boolean
  extrasData?: { id: string; nombre: string; precio: number }[]
  tamanios?: {
    [key: string]: {
      precio: number
      selected: boolean
    }
  }
}

// Define the Order type
export interface Order {
  id?: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  items: OrderItem[]
  total: number
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  createdAt?: any
}

// Define the OrderItem type
export interface OrderItem {
  productId: string
  productName: string
  precio: number
  quantity: number
  size?: string
  subtotal: number
  observations?: string
  withBoneless?: boolean
  bonelessSauce?: string
}

// Funciones para gestionar usuarios

// Función para obtener todos los usuarios
export const getUsers = async (): Promise<User[]> => {
  try {
    console.log("Obteniendo usuarios de Firestore") // Depuración
    const usersRef = collection(db, "users")
    const q = query(usersRef)
    const querySnapshot = await getDocs(q)

    const users = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as User,
    )

    console.log("Usuarios obtenidos:", users) // Depuración
    return users
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

// Función para añadir un nuevo usuario
export const addUser = async (userData: {
  email: string
  password: string
  displayName: string
  role: "admin" | "cashier" | "employee" | "owner"
}): Promise<string | null> => {
  try {
    console.log("Creando usuario en Auth:", userData.email) // Depuración

    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const uid = userCredential.user.uid

    console.log("Usuario creado en Auth, UID:", uid) // Depuración

    // Guardar datos del usuario en Firestore
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("Usuario guardado en Firestore") // Depuración
    return uid
  } catch (error) {
    console.error("Error al añadir usuario:", error)
    throw error
  }
}

// Función para actualizar un usuario
export const updateUser = async (
  userId: string,
  userData: Partial<{ displayName: string; role: "admin" | "cashier" | "employee" | "owner" }>,
): Promise<boolean> => {
  try {
    console.log("Actualizando usuario:", userId, userData) // Depuración

    if (!userId) {
      console.error("Error: ID de usuario no proporcionado")
      return false
    }

    // Verificar si el usuario existe antes de intentar actualizarlo
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.error("Error: El usuario no existe en la base de datos")
      return false
    }

    const currentUserData = userDoc.data()

    // Si el usuario es propietario, solo permitir actualizar el displayName
    if (currentUserData.role === "owner") {
      // Solo actualizar el displayName para el propietario
      await updateDoc(userRef, {
        displayName: userData.displayName,
        updatedAt: serverTimestamp(),
      })
      console.log("Propietario actualizado (solo nombre)") // Depuración
    } else {
      // Actualizar todos los campos para otros usuarios
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
      console.log("Usuario actualizado completamente") // Depuración
    }
    return true
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${userId}:`, error)
    return false
  }
}

// Función para eliminar un usuario
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    console.log("Eliminando usuario:", userId) // Depuración

    // Verificar si el usuario es propietario
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists() && userDoc.data().role === "owner") {
      throw new Error("No se puede eliminar al usuario propietario")
    }

    // Eliminar el documento de Firestore
    await deleteDoc(userRef)
    console.log("Usuario eliminado de Firestore") // Depuración

    // Nota: Eliminar el usuario de Firebase Auth requeriría permisos de administrador
    // o estar en un contexto de Cloud Functions

    return true
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${userId}:`, error)
    throw error
  }
}

// Funciones para gestionar productos

// Función para obtener todos los productos
export const getProducts = async (): Promise<Product[]> => {
  try {
    console.log("Iniciando obtención de productos desde Firestore")
    // Corregido: usar "productos" en lugar de "products"
    const productsRef = collection(db, "productos")
    console.log("Referencia a colección de productos creada")

    const querySnapshot = await getDocs(productsRef)
    console.log(`Productos encontrados: ${querySnapshot.size}`)

    const products = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    // Ordenar productos: primero pizzas, luego el resto
    const sortedProducts = [...products].sort((a, b) => {
      if (a.tipo?.toLowerCase() === "pizza") return -1
      if (b.tipo?.toLowerCase() === "pizza") return 1
      return 0
    })

    console.log("Productos procesados y ordenados:", sortedProducts)
    return sortedProducts
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Función para añadir un nuevo producto
export const addProduct = async (productData: Omit<Product, "id">): Promise<string | null> => {
  try {
    console.log("Añadiendo producto a Firestore:", JSON.stringify(productData, null, 2))

    // Corregido: usar "productos" en lugar de "products"
    const productsRef = collection(db, "productos")

    // Asegurarnos de que los datos están en el formato correcto
    const dataToSave = {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Si es una pizza, asegurarse de que no tiene precio general y forzar tieneExtras a false
    if (productData.tipo === "pizza") {
      delete dataToSave.precio
      dataToSave.tieneExtras = false
      dataToSave.extrasData = null
    }

    // Si no es pizza pero tiene extras activados, asegurar que se envía un array vacío si no hay extras
    if (productData.tipo !== "pizza" && productData.tieneExtras && !productData.extrasData) {
      dataToSave.extrasData = []
    }

    console.log("Datos finales a guardar:", JSON.stringify(dataToSave, null, 2))

    const docRef = await addDoc(productsRef, dataToSave)
    console.log("Producto añadido con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error al añadir producto:", error)
    throw error // Propagar el error para manejarlo en el componente
  }
}

// Función para actualizar un producto
export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<boolean> => {
  try {
    console.log("Actualizando producto:", productId, JSON.stringify(productData, null, 2))

    // Corregido: usar "productos" en lugar de "products"
    const productRef = doc(db, "productos", productId)

    // Si es una pizza, asegurarse de que no tiene precio general y forzar tieneExtras a false
    if (productData.tipo === "pizza") {
      delete productData.precio
      productData.tieneExtras = false
      productData.extrasData = null
    }

    await updateDoc(productRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    })

    console.log("Producto actualizado correctamente")
    return true
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    throw error // Propagar el error  {
    console.error("Error al actualizar producto:", error)
    throw error // Propagar el error para manejarlo en el componente
  }
}

// Función para eliminar un producto
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    // Corregido: usar "productos" en lugar de "products"
    const productRef = doc(db, "productos", productId)
    await deleteDoc(productRef)
    return true
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return false
  }
}

// Funciones para gestionar órdenes

// Función para añadir una nueva orden
export const addOrder = async (orderData: any): Promise<string | null> => {
  try {
    const ordersRef = collection(db, "orders")
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error al añadir pedido:", error)
    return null
  }
}

// Función para actualizar el estado de una orden
export const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<boolean> => {
  try {
    const orderRef = doc(db, "orders", orderId)
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error al actualizar estado de la orden:", error)
    return false
  }
}

// Funciones para obtener datos del dashboard

// Función para obtener los productos más vendidos
export const getTopProducts = async (limitCount = 5) => {
  if (!db) return []

  try {
    console.log("Obteniendo productos más vendidos")

    // Obtener todas las ventas - primero sin filtros para verificar
    const ventasRef = collection(db, "ventas")
    const q = query(ventasRef)

    console.log("Ejecutando consulta para productos más vendidos...")
    const ventasSnapshot = await getDocs(q)
    console.log("Total de ventas encontradas:", ventasSnapshot.size)

    // Si no hay ventas, retornar array vacío
    if (ventasSnapshot.empty) {
      console.log("No se encontraron ventas")
      return []
    }

    // Mapa para acumular ventas por producto
    const productMap = new Map()

    // Procesar cada venta
    ventasSnapshot.docs.forEach((doc) => {
      const venta = doc.data()
      console.log(`Procesando venta ${doc.id}, datos:`, JSON.stringify(venta, null, 2))

      const productos = venta.productos || []

      if (productos.length === 0) {
        console.log("Venta sin productos:", doc.id)
      }

      productos.forEach((producto) => {
        const id = producto.productId || producto.id
        const nombre = producto.productName || producto.nombre
        const precio = producto.precio || 0
        const cantidad = producto.quantity || 1
        const categoria = producto.categoria || "Sin categoría"

        console.log(`Producto encontrado: ${nombre}, cantidad: ${cantidad}, categoría: ${categoria}`)

        if (productMap.has(id)) {
          const current = productMap.get(id)
          productMap.set(id, {
            ...current,
            ventas: current.ventas + cantidad,
          })
        } else {
          productMap.set(id, {
            id,
            nombre,
            precio,
            categoria,
            ventas: cantidad,
          })
        }
      })
    })

    // Convertir a array y ordenar por ventas
    const products = Array.from(productMap.values())
    products.sort((a, b) => b.ventas - a.ventas)

    console.log("Productos procesados:", products.length)
    console.log("Top productos:", JSON.stringify(products.slice(0, limitCount), null, 2))
    return products.slice(0, limitCount)
  } catch (error) {
    console.error("Error al obtener productos más vendidos:", error)
    return []
  }
}

// Función para obtener ventas recientes
export const getRecentSales = async (limitCount = 5) => {
  if (!db) return []

  try {
    console.log("Obteniendo ventas recientes")

    // Vamos a imprimir más información para depuración
    console.log("Colección a consultar:", "ventas")
    console.log("Límite de ventas:", limitCount)

    const ventasRef = collection(db, "ventas")
    const q = query(ventasRef, orderBy("fecha", "desc"), firestoreLimit(limitCount))

    console.log("Ejecutando consulta...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas encontradas:", ventasSnapshot.size)

    // Verificar si hay documentos
    if (ventasSnapshot.empty) {
      console.log("No se encontraron ventas en la colección")
      return []
    }

    // Imprimir el primer documento para ver su estructura
    if (ventasSnapshot.docs.length > 0) {
      console.log("Estructura del primer documento:", JSON.stringify(ventasSnapshot.docs[0].data(), null, 2))
    }

    const ventas = ventasSnapshot.docs.map((doc) => {
      const data = doc.data()
      // Verificar si fecha existe y es un timestamp
      const fecha = data.fecha
        ? typeof data.fecha.toDate === "function"
          ? data.fecha.toDate()
          : new Date(data.fecha)
        : new Date()

      return {
        id: doc.id,
        clientName: data.nombreCliente || "Cliente",
        total: data.total || 0,
        paymentMethod: data.metodoPago || "efectivo",
        isDollar: data.isDollar || false,
        date: fecha,
        productos: data.productos || [],
      }
    })

    console.log("Ventas procesadas:", ventas.length)
    console.log("Ventas recientes:", JSON.stringify(ventas, null, 2))
    return ventas
  } catch (error) {
    console.error("Error al obtener ventas recientes:", error)
    return []
  }
}

// Función para obtener ventas del día
export const getDailySales = async () => {
  if (!db) return { count: 0, total: 0, byPaymentMethod: {} }

  try {
    console.log("Obteniendo ventas del día")

    // Obtener fecha de inicio y fin del día actual
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log("Rango de fechas:", today, tomorrow)

    // Consultar ventas del día - Primero intentemos sin filtro de fecha para ver si hay documentos
    const ventasRef = collection(db, "ventas")
    let q = query(ventasRef)

    console.log("Ejecutando consulta sin filtros para verificar documentos...")
    const checkSnapshot = await getDocs(q)
    console.log("Total de documentos en la colección:", checkSnapshot.size)

    // Si hay documentos, ahora intentemos con el filtro de fecha
    if (checkSnapshot.size > 0) {
      // Imprimir el primer documento para ver su estructura
      console.log("Estructura del primer documento:", JSON.stringify(checkSnapshot.docs[0].data(), null, 2))

      // Verificar si el campo fecha existe y es un timestamp
      const primerDoc = checkSnapshot.docs[0].data()
      if (primerDoc.fecha) {
        console.log("Tipo de campo fecha:", typeof primerDoc.fecha)
        console.log("¿Es timestamp?", typeof primerDoc.fecha.toDate === "function")
      } else {
        console.log("El campo fecha no existe en el documento")
      }
    }

    // Ahora intentemos con el filtro de fecha
    q = query(ventasRef, where("fecha", ">=", today), where("fecha", "<", tomorrow))

    console.log("Ejecutando consulta con filtro de fecha...")
    const ventasSnapshot = await getDocs(q)
    console.log("Ventas del día encontradas:", ventasSnapshot.size)

    const ventas = ventasSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Calcular totales
    const count = ventas.length
    const total = ventas.reduce((sum, venta) => sum + (venta.total || 0), 0)

    // Agrupar por método de pago
    const byPaymentMethod = {
      efectivo: ventas
        .filter((venta) => venta.metodoPago === "efectivo")
        .reduce((sum, venta) => sum + (venta.total || 0), 0),
      tarjeta: ventas
        .filter((venta) => venta.metodoPago === "tarjeta")
        .reduce((sum, venta) => sum + (venta.total || 0), 0),
      transferencia: ventas
        .filter((venta) => venta.metodoPago === "transferencia")
        .reduce((sum, venta) => sum + (venta.total || 0), 0),
    }

    console.log("Resumen de ventas del día:", { count, total, byPaymentMethod })
    return { count, total, byPaymentMethod }
  } catch (error) {
    console.error("Error al obtener ventas del día:", error)
    return { count: 0, total: 0, byPaymentMethod: {} }
  }
}

// Función para añadir una nueva venta
export const addSale = async (saleData: any): Promise<string | null> => {
  try {
    console.log("Añadiendo venta a la colección 'ventas':", saleData)
    const ventasRef = collection(db, "ventas")

    // Asegurarnos de que los datos tienen el formato correcto
    const ventaData = {
      ...saleData,
      fecha: serverTimestamp(),
      nombreCliente: saleData.clientName || "Cliente",
      metodoPago: saleData.paymentMethod || "efectivo",
      productos: saleData.items || [],
      total: saleData.total || 0,
      subtotal: saleData.subtotal || 0,
      corteDiaCerrado: false,
    }

    const docRef = await addDoc(ventasRef, ventaData)
    console.log("Venta añadida con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error al añadir venta:", error)
    return null
  }
}
