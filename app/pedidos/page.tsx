"use client"

import { useState, useEffect } from "react"
import { Search, User, Calendar, CreditCard, Check, X, ClipboardList, Printer, AlertCircle, Clock } from "lucide-react"
import { getOrders, updateOrderStatus } from "@/lib/orders"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { printTicket } from "@/lib/print-ticket"

export default function PedidosPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("todos")
  const { toast } = useToast()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setMounted(true)

    const loadOrders = async () => {
      try {
        if (typeof window !== "undefined") {
          const ordersData = await getOrders()
          setOrders(ordersData)
          setFilteredOrders(ordersData)

          // Contar pedidos pendientes
          const pendingOrders = ordersData.filter((order) => order.status === "pending")
          setPendingCount(pendingOrders.length)
        }
      } catch (error) {
        console.error("Error al cargar pedidos:", error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadOrders()

      // Actualizar pedidos cada 30 segundos
      const interval = setInterval(loadOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [mounted])

  // Filtrar pedidos por estado y búsqueda
  useEffect(() => {
    if (!orders.length) return

    let filtered = [...orders]

    // Filtrar por estado
    if (activeTab !== "todos") {
      filtered = filtered.filter((order) => order.status === activeTab)
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerPhone?.includes(searchQuery),
      )
    }

    setFilteredOrders(filtered)
  }, [activeTab, searchQuery, orders])

  // Marcar pedido como entregado
  const markAsDelivered = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "delivered")

      // Actualizar estado local
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: "delivered" } : order))
      setOrders(updatedOrders)

      // Actualizar contador de pendientes
      const pendingOrders = updatedOrders.filter((order) => order.status === "pending")
      setPendingCount(pendingOrders.length)

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido marcado como entregado",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al actualizar pedido:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    }
  }

  // Marcar pedido como cancelado
  const cancelOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "cancelled")

      // Actualizar estado local
      const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: "cancelled" } : order))
      setOrders(updatedOrders)

      // Actualizar contador de pendientes
      const pendingOrders = updatedOrders.filter((order) => order.status === "pending")
      setPendingCount(pendingOrders.length)

      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido cancelado correctamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al cancelar pedido:", error)
      toast({
        title: "Error",
        description: "No se pudo cancelar el pedido",
        variant: "destructive",
      })
    }
  }

  // Reimprimir ticket
  const reprintTicket = async (order) => {
    try {
      // Preparar datos para el ticket
      const ticketData = {
        items: order.items.map((item) => ({
          nombre: item.productName,
          precio: item.precio,
          cantidad: item.quantity,
          subtotal: item.subtotal,
          variante: item.size,
          observaciones: item.observations,
          withBoneless: item.withBoneless || false,
          bonelessSauce: item.bonelessSauce || null,
        })),
        subtotal: order.subtotal || order.total,
        total: order.total,
        clientName: order.customerName,
        phoneNumber: order.customerPhone,
        metodoPago: order.paymentMethod,
        fecha: order.createdAt ? new Date(order.createdAt.toDate()) : new Date(),
        folio: `REIMP-${order.id.slice(-4)}`,
        tipoVenta: "reimpresión",
      }

      // Imprimir ticket
      await printTicket(ticketData)

      toast({
        title: "Ticket reimpreso",
        description: "El ticket se ha enviado a la impresora",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al reimprimir ticket:", error)
      toast({
        title: "Error",
        description: "No se pudo reimprimir el ticket",
        variant: "destructive",
      })
    }
  }

  // Obtener color y texto según estado
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { color: "bg-amber-500", text: "Pendiente", icon: <Clock size={16} className="mr-1" /> }
      case "delivered":
        return { color: "bg-green-500", text: "Entregado", icon: <Check size={16} className="mr-1" /> }
      case "cancelled":
        return { color: "bg-red-500", text: "Cancelado", icon: <X size={16} className="mr-1" /> }
      default:
        return { color: "bg-gray-500", text: "Desconocido", icon: <AlertCircle size={16} className="mr-1" /> }
    }
  }

  // Obtener color de fondo según estado
  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 border-amber-200"
      case "delivered":
        return "bg-green-50 border-green-200"
      case "cancelled":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (!mounted) return null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pedidos</h1>
        {pendingCount > 0 && (
          <div className="relative">
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {pendingCount}
            </span>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              Pedidos pendientes
            </Badge>
          </div>
        )}
      </div>

      {/* Pestañas de filtrado */}
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="todos" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
            Todos
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
            Pendientes
            {pendingCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
            Entregados
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
            Cancelados
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Buscar por cliente, teléfono o ID..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sección de pedidos */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={20} className="text-amber-600" />
          <h2 className="text-xl font-bold">Comandas</h2>
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p>Cargando pedidos...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const bgColorClass = getStatusBackgroundColor(order.status)

              return (
                <div
                  key={order.id}
                  className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${bgColorClass}`}
                >
                  {/* Cabecera del pedido - Información del cliente */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                          <User size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{order.customerName || "Cliente sin nombre"}</h3>
                          {order.customerPhone && <p className="text-xs text-gray-500">Tel: {order.customerPhone}</p>}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.color} text-white`}
                      >
                        {statusInfo.icon}
                        {statusInfo.text}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <p>ID: {order.id.slice(-6)}</p>
                    </div>
                  </div>

                  {/* Contenido del pedido - Productos */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-700 mb-3 pb-1 border-b border-gray-100">Productos:</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">
                                {item.productName} {item.size ? `(${item.size})` : ""} x{item.quantity}
                              </span>
                            </div>
                            <span className="font-medium text-gray-700">{formatCurrency(item.subtotal)}</span>
                          </div>

                          {/* Mostrar información de boneless con estilo destacado */}
                          {item.withBoneless && (
                            <div className="bg-amber-100 border-l-4 border-amber-500 pl-2 py-1 mt-1 text-amber-800 font-medium rounded-r-md">
                              + BONELESS {item.bonelessSauce ? `(${item.bonelessSauce})` : ""}
                            </div>
                          )}

                          {item.observations && (
                            <p className="text-xs text-gray-500 mt-1 italic">Obs: {item.observations}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Información de pago */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard size={16} className="mr-1" />
                        <span>
                          {order.paymentMethod === "efectivo"
                            ? "Efectivo"
                            : order.paymentMethod === "tarjeta"
                              ? "Tarjeta"
                              : order.paymentMethod === "transferencia"
                                ? "Transferencia"
                                : order.paymentMethod}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total:</p>
                        <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones - Botones */}
                  <div className="p-4 border-t border-gray-100 flex justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                      onClick={() => reprintTicket(order)}
                    >
                      <Printer size={16} className="mr-1" /> Reimprimir
                    </Button>

                    {order.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => cancelOrder(order.id)}
                        >
                          <X size={16} className="mr-1" /> Cancelar
                        </Button>

                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600"
                          onClick={() => markAsDelivered(order.id)}
                        >
                          <Check size={16} className="mr-1" /> Entregar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No se encontraron pedidos</p>
            <p className="text-sm text-gray-400 mt-1">Intenta con otra búsqueda o filtro</p>
          </div>
        )}
      </div>
    </div>
  )
}
