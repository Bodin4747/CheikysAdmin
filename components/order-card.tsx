"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Order, updateOrderStatus } from "@/lib/firestore"
import { toast } from "@/components/ui/use-toast"

// Mapa de colores para los estados
const statusColors: Record<Order["status"], string> = {
  pending: "bg-yellow-500",
  preparing: "bg-blue-500",
  ready: "bg-green-500",
  delivered: "bg-purple-500",
  cancelled: "bg-red-500",
}

// Mapa de nombres en español para los estados
const statusNames: Record<Order["status"], string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

interface OrderCardProps {
  order: Order
  onStatusChange?: () => void
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Función para actualizar el estado del pedido
  const handleStatusChange = async (newStatus: Order["status"]) => {
    setIsLoading(true)

    try {
      if (order.id) {
        const success = await updateOrderStatus(order.id, newStatus)

        if (success) {
          toast({
            title: "Estado actualizado",
            description: `El pedido ahora está ${statusNames[newStatus].toLowerCase()}.`,
          })

          // Llamar al callback si existe
          if (onStatusChange) {
            onStatusChange()
          }
        } else {
          toast({
            title: "Error",
            description: "No se pudo actualizar el estado del pedido.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función formatDate para asegurar que maneje correctamente los timestamps de Firestore
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida"

    try {
      // Si es un timestamp de Firestore, convertirlo a Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

      return new Intl.DateTimeFormat("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date)
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Fecha inválida"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Pedido #{order.id?.slice(-4)}</CardTitle>
          <Badge className={statusColors[order.status]}>{statusNames[order.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="font-medium">Cliente:</p>
            <p>{order.customerName}</p>
          </div>
          <div>
            <p className="font-medium">Teléfono:</p>
            <p>{order.customerPhone}</p>
          </div>
          {order.customerAddress && (
            <div>
              <p className="font-medium">Dirección:</p>
              <p>{order.customerAddress}</p>
            </div>
          )}
          <div>
            <p className="font-medium">Productos:</p>
            <ul className="list-disc pl-5">
              {order.items.map((item, index) => (
                <li key={index}>
                  {item.quantity} x {item.productName} {item.size ? `(${item.size})` : ""} - ${item.subtotal.toFixed(2)}
                  {item.withBoneless && (
                    <div className="text-amber-600 font-medium ml-5">
                      + BONELESS {item.bonelessSauce ? `(${item.bonelessSauce})` : ""}
                    </div>
                  )}
                  {item.observations && <div className="text-gray-500 text-xs ml-5">Obs: {item.observations}</div>}
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-2">
            <p className="font-medium">Total: ${order.total.toFixed(2)}</p>
          </div>
          <div className="text-xs text-muted-foreground">Creado: {formatDate(order.createdAt)}</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {order.status === "pending" && (
          <>
            <Button size="sm" onClick={() => handleStatusChange("preparing")} disabled={isLoading}>
              Preparar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange("cancelled")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </>
        )}

        {order.status === "preparing" && (
          <Button size="sm" onClick={() => handleStatusChange("ready")} disabled={isLoading}>
            Marcar como listo
          </Button>
        )}

        {order.status === "ready" && (
          <Button size="sm" onClick={() => handleStatusChange("delivered")} disabled={isLoading}>
            Marcar como entregado
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
