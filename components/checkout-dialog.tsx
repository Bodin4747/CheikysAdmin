"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type OrderItem, addOrder } from "@/lib/firestore"
import { toast } from "@/components/ui/use-toast"

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  items: OrderItem[]
  total: number
  onSuccess: () => void
}

export function CheckoutDialog({ isOpen, onClose, items, total, onSuccess }: CheckoutDialogProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerPhone) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el nombre y teléfono del cliente.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear el objeto de pedido
      const order = {
        customerName,
        customerPhone,
        customerAddress,
        items,
        total,
        status: "pending" as const,
      }

      // Guardar el pedido en Firestore
      const orderId = await addOrder(order)

      if (orderId) {
        toast({
          title: "Pedido creado",
          description: `El pedido #${orderId.slice(-4)} ha sido creado exitosamente.`,
        })

        // Resetear el formulario
        setCustomerName("")
        setCustomerPhone("")
        setCustomerAddress("")

        // Llamar al callback de éxito
        onSuccess()

        // Cerrar el diálogo
        onClose()
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el pedido.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al crear pedido:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el pedido.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Nombre del cliente</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ingresa el nombre del cliente"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerPhone">Teléfono</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ingresa el teléfono del cliente"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerAddress">Dirección (opcional)</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Ingresa la dirección de entrega"
                rows={3}
              />
            </div>
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Resumen del pedido</h3>
              <ul className="space-y-1 mb-2">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>
                      {item.quantity} x {item.productName}
                    </span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}></Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
