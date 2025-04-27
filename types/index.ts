// Definición de tipos para la aplicación

// Tipo para productos
export interface Product {
  id: string
  name: string
  price: number
  description: string
  category: string
  imageUrl: string
  stock: number
  createdAt: Date
  updatedAt: Date
}

// Tipo para elementos en el carrito
export interface CartItem {
  product: Product
  quantity: number
}

// Tipo para pedidos
export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: "pending" | "completed" | "cancelled"
  customerName: string
  customerPhone?: string
  paymentMethod: "cash" | "card"
  createdAt: Date
  updatedAt: Date
}

// Tipo para estadísticas
export interface Stats {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: {
    product: Product
    quantity: number
  }[]
}

// Tipo para usuario
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
}

// Tipo para configuración
export interface Settings {
  storeName: string
  storePhone: string
  storeAddress: string
  taxRate: number
  currency: string
}
