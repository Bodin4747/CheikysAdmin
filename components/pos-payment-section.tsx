"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { User, Phone, DollarSign, CreditCard, Receipt, Banknote } from "lucide-react"
import { getTaxConfig, getCurrencyConfig } from "@/lib/config"
import { printTicket } from "@/lib/print-ticket"

interface POSPaymentSectionProps {
  cart: any[]
  clientName: string
  setClientName: (name: string) => void
  saleType: string
  setSaleType: (type: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onFinalizeSale: () => Promise<void>
}

export function POSPaymentSection({
  cart,
  clientName,
  setClientName,
  saleType,
  setSaleType,
  paymentMethod,
  setPaymentMethod,
  onFinalizeSale,
}: POSPaymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cashReceived, setCashReceived] = useState("")
  const [showChangeAmount, setShowChangeAmount] = useState(false)
  const [changeAmount, setChangeAmount] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState("")

  // Estado para configuraciones
  const [taxConfig, setTaxConfig] = useState({
    habilitarIVA: false,
    porcentajeIVA: 16,
    aplicarIVAAutomaticamente: false,
  })

  const [currencyConfig, setCurrencyConfig] = useState({
    precioDolar: 17.5,
    habilitarPagosEnDolar: true,
  })

  const [selectedCurrency, setSelectedCurrency] = useState("mxn")
  const [dollarAmount, setDollarAmount] = useState("")

  // Cargar configuraciones
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const tax = await getTaxConfig()
        const currency = await getCurrencyConfig()

        setTaxConfig(tax)
        setCurrencyConfig(currency)
      } catch (error) {
        console.error("Error al cargar configuraciones:", error)
      }
    }

    loadConfigs()
  }, [])

  // Calcular subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0)

  // Calcular IVA si está habilitado y es automático
  let iva = 0
  if (taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente) {
    iva = subtotal * (taxConfig.porcentajeIVA / 100)
  }

  // Calcular total
  const total = subtotal + iva

  // Manejar cambio de método de pago
  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value)
    setShowChangeAmount(false)
    setCashReceived("")
    setDollarAmount("")

    // No resetear la moneda seleccionada al cambiar el método de pago
    // para mantener la selección del usuario
  }

  // Calcular cambio para efectivo en pesos
  const calculateChange = () => {
    if (!cashReceived) return

    const receivedAmount = Number.parseFloat(cashReceived)
    if (receivedAmount >= total) {
      setChangeAmount(receivedAmount - total)
      setShowChangeAmount(true)
    } else {
      setShowChangeAmount(false)
    }
  }

  // Calcular cambio para dólares
  const calculateDollarChange = () => {
    if (!dollarAmount) return

    const receivedUSD = Number.parseFloat(dollarAmount)
    const receivedMXN = receivedUSD * currencyConfig.precioDolar

    if (receivedMXN >= total) {
      setChangeAmount(receivedMXN - total)
      setShowChangeAmount(true)
    } else {
      setShowChangeAmount(false)
    }
  }

  // Manejar finalización de venta
  const handleFinishSale = async () => {
    setIsLoading(true)
    try {
      // Imprimir ticket
      const ticketData = {
        items: cart.map((item) => ({
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.quantity,
          subtotal: item.precio * item.quantity,
          variante: item.variantName,
        })),
        subtotal,
        iva: taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente ? iva : undefined,
        total,
        clientName,
        phoneNumber: saleType === "telefono" ? phoneNumber : undefined,
        metodoPago: getPaymentMethodName(paymentMethod),
        cambio: showChangeAmount ? changeAmount : undefined,
        fecha: new Date(),
        folio: `VTA-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
        tipoVenta: saleType,
      }

      // Imprimir ticket antes de finalizar la venta
      await printTicket(ticketData)

      // Finalizar la venta
      await onFinalizeSale()
    } catch (error) {
      console.error("Error al finalizar venta:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener nombre del método de pago
  const getPaymentMethodName = (method) => {
    switch (method) {
      case "efectivo":
        return selectedCurrency === "usd" ? "Efectivo (USD)" : "Efectivo"
      case "tarjeta":
        return "Tarjeta"
      case "transferencia":
        return "Transferencia"
      default:
        return method
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente && (
          <div className="flex justify-between">
            <span>IVA ({taxConfig.porcentajeIVA}%):</span>
            <span>{formatCurrency(iva)}</span>
          </div>
        )}

        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nombre del cliente</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Nombre del cliente"
              className="pl-10"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Tipo de venta</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button
              type="button"
              variant={saleType === "local" ? "default" : "outline"}
              className={saleType === "local" ? "bg-amber-500 hover:bg-amber-600" : ""}
              onClick={() => setSaleType("local")}
            >
              Local
            </Button>
            <Button
              type="button"
              variant={saleType === "telefono" ? "default" : "outline"}
              className={saleType === "telefono" ? "bg-amber-500 hover:bg-amber-600" : ""}
              onClick={() => setSaleType("telefono")}
            >
              <Phone className="mr-2 h-4 w-4" /> Teléfono
            </Button>
          </div>
        </div>

        {/* Campo de teléfono cuando se selecciona venta por teléfono */}
        {saleType === "telefono" && (
          <div className="bg-amber-50 p-3 rounded-md">
            <label className="text-sm font-medium">Número de teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Número de teléfono"
                className="pl-10"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                type="tel"
              />
            </div>
          </div>
        )}

        {/* Selector de moneda - Siempre visible para mayor claridad */}
        <div className="bg-blue-50 p-3 rounded-md">
          <label className="text-sm font-medium mb-2 block">Moneda de pago</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={selectedCurrency === "mxn" ? "default" : "outline"}
              className={selectedCurrency === "mxn" ? "bg-amber-500 hover:bg-amber-600" : ""}
              onClick={() => setSelectedCurrency("mxn")}
            >
              MXN (Pesos)
            </Button>
            <Button
              type="button"
              variant={selectedCurrency === "usd" ? "default" : "outline"}
              className={selectedCurrency === "usd" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              onClick={() => setSelectedCurrency("usd")}
            >
              <DollarSign className="h-4 w-4 mr-1" /> USD (Dólares)
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Método de pago</label>
          <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo" className="flex items-center">
                <div className="flex items-center">
                  <Banknote className="mr-2 h-4 w-4" /> Efectivo
                </div>
              </SelectItem>
              <SelectItem value="tarjeta" className="flex items-center">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" /> Tarjeta
                </div>
              </SelectItem>
              <SelectItem value="transferencia" className="flex items-center">
                <div className="flex items-center">
                  <Receipt className="mr-2 h-4 w-4" /> Transferencia
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Opciones específicas según método de pago */}
        {paymentMethod === "efectivo" && (
          <div className="space-y-4 bg-gray-50 p-3 rounded-md">
            {selectedCurrency === "mxn" ? (
              <>
                <div>
                  <label className="text-sm font-medium">Efectivo recibido (MXN)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onBlur={calculateChange}
                      className="text-right"
                    />
                  </div>
                </div>

                {showChangeAmount && (
                  <div className="bg-green-50 p-2 rounded-md">
                    <label className="text-sm font-medium text-green-700">Cambio a devolver:</label>
                    <div className="text-xl font-bold text-green-700 text-right">{formatCurrency(changeAmount)}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Dólares recibidos (USD)</label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={dollarAmount}
                        onChange={(e) => setDollarAmount(e.target.value)}
                        onBlur={calculateDollarChange}
                        className="pl-10 text-right"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Tipo de cambio: 1 USD = {formatCurrency(currencyConfig.precioDolar)}
                  </div>

                  {showChangeAmount && (
                    <div className="bg-green-50 p-2 rounded-md">
                      <label className="text-sm font-medium text-green-700">Cambio a devolver (MXN):</label>
                      <div className="text-xl font-bold text-green-700 text-right">{formatCurrency(changeAmount)}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <Button
          className="w-full bg-amber-500 hover:bg-amber-600"
          onClick={handleFinishSale}
          disabled={isLoading || cart.length === 0 || (saleType === "telefono" && !phoneNumber)}
        >
          {isLoading ? "Procesando..." : "Finalizar Venta"}
        </Button>
      </div>
    </div>
  )
}
