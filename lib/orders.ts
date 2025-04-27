// lib/orders.ts
"use client"

import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { formatDate } from "./utils"

// Function to create a new order
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

// Función para obtener órdenes recientes
export const getRecentOrders = async (limitCount = 5) => {
  if (!db) return []

  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, orderBy("createdAt", "desc"), limit(limitCount))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        customerName: data.customerName || "Cliente",
        total: data.total || 0,
        time: formatDate(data.createdAt?.toDate() || new Date(), "HH:mm a"),
        status: data.status || "pending",
      }
    })
  } catch (error) {
    console.error("Error al obtener órdenes recientes:", error)
    return []
  }
}

// Función para obtener todas las órdenes
export const getOrders = async () => {
  if (!db) return []

  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || Timestamp.now(),
    }))
  } catch (error) {
    console.error("Error al obtener órdenes:", error)
    return []
  }
}

// Función para actualizar el estado de una orden
export const updateOrderStatus = async (orderId: string, status: any) => {
  if (!db) return false

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

// Función para obtener ventas del día
export const getTodaySales = async () => {
  if (!db) return { count: 0, total: 0 }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const salesRef = collection(db, "sales")
    const q = query(salesRef, where("date", ">=", today))
    const querySnapshot = await getDocs(q)

    const sales = querySnapshot.docs.map((doc) => doc.data())
    const count = sales.length
    const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)

    return { count, total }
  } catch (error) {
    console.error("Error al obtener ventas del día:", error)
    return { count: 0, total: 0 }
  }
}
