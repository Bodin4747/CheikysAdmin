"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Minus, Trash2, Phone, User, DollarSign, CreditCard, Receipt, Banknote } from "lucide-react"
import { getProducts, addSale } from "@/lib/firestore"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { getTaxConfig, getCurrencyConfig } from "@/lib/config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipo para un producto en el carrito
interface CartItem {
  id: string
  nombre: string
  precio: number
  quantity: number
  size?: string
  variantName?: string
}

export default function POSPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientName, setClientName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [saleType, setSaleType] = useState("local")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [selectedCurrency, setSelectedCurrency] = useState("mxn")
  const [cashReceived, setCashReceived] = useState("")
  const [dollarAmount, setDollarAmount] = useState("")
  const [showChangeAmount, setShowChangeAmount] = useState(false)
  const [changeAmount, setChangeAmount] = useState(0)

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Cargar productos
        const productsData = await getProducts()
        setProducts(productsData)

        // Cargar configuraciones
        const tax = await getTaxConfig()
        const currency = await getCurrencyConfig()

        setTaxConfig(tax)
        setCurrencyConfig(currency)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Obtener categorías únicas de los productos
  const categories = [
    { id: "todos", name: "Todos" },
    { id: "pizzas", name: "Pizzas" },
    { id: "complementos", name: "Complementos" },
    { id: "bebidas", name: "Bebidas" },
    { id: "otro", name: "Otro" },
  ]

  // Filtrar productos por categoría y término de búsqueda
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "todos" || product.categoria?.toLowerCase() === selectedCategory
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Añadir producto al carrito
  const addToCart = (product: any) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)

      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            quantity: 1,
          },
        ]
      }
    })
  }

  // Eliminar producto del carrito
  const removeFromCart = (index: number) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== index))
  }

  // Actualizar cantidad de un producto
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }

    setCartItems((prevItems) => prevItems.map((item, i) => (i === index ? { ...item, quantity } : item)))
  }

  // Calcular subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.precio * item.quantity, 0)
  }

  // Calcular impuestos según configuración
  const calculateTax = () => {
    if (taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente) {
      return calculateSubtotal() * (taxConfig.porcentajeIVA / 100)
    }
    return 0
  }

  // Calcular total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  // Calcular cambio para efectivo
  const calculateChange = () => {
    if (!cashReceived) return

    const receivedAmount = Number.parseFloat(cashReceived)
    if (receivedAmount >= calculateTotal()) {
      setChangeAmount(receivedAmount - calculateTotal())
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

    if (receivedMXN >= calculateTotal()) {
      setChangeAmount(receivedMXN - calculateTotal())
      setShowChangeAmount(true)
    } else {
      setShowChangeAmount(false)
    }
  }

  // Imprimir ticket
  const printTicket = () => {
    try {
      // Crear el contenido del ticket
      const ticketContent = generateTicketHTML()

      // Abrir una ventana para imprimir
      const printWindow = window.open("", "_blank")

      if (!printWindow) {
        console.error("No se pudo abrir la ventana de impresión")
        return false
      }

      printWindow.document.write(ticketContent)
      printWindow.document.close()

      // Imprimir después de que la página se cargue
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }

      return true
    } catch (error) {
      console.error("Error al imprimir ticket:", error)
      return false
    }
  }

  // Generar HTML del ticket
  const generateTicketHTML = () => {
    const subtotal = calculateSubtotal()
    const iva = calculateTax()
    const total = calculateTotal()
    const fecha = new Date()

    const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(fecha)

    const folio = `VTA-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Venta</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .center {
            text-align: center;
          }
          .items {
            width: 100%;
          }
          .item {
            margin-bottom: 5px;
          }
          .divider {
            border-bottom: 1px dashed black;
            margin: 10px 0;
          }
          .totals {
            text-align: right;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>CHEIKYS PIZZA</div>
          <div>Dirección: Constitución #123</div>
          <div>Tel: 555-123-4567</div>
        </div>
        
        <div class="center">
          <div>Fecha: ${fechaFormateada}</div>
          <div>Folio: ${folio}</div>
          <div>Cliente: ${clientName || "Cliente General"}</div>
          ${saleType === "telefono" ? `<div>Teléfono: ${phoneNumber}</div>` : ""}
          <div>Tipo de venta: ${saleType === "local" ? "Local" : "Teléfono"}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${cartItems
            .map(
              (item) => `
            <div class="item">
              <div><strong>${item.nombre} x ${item.quantity}</strong></div>
              <div style="display: flex; justify-content: space-between;">
                <span>${item.precio.toFixed(2)}</span>
                <span>${(item.precio * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          ${
            iva > 0
              ? `
            <div style="display: flex; justify-content: space-between;">
              <span>IVA (${taxConfig.porcentajeIVA}%):</span>
              <span>${iva.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>Método de pago:</span>
            <span>${
              paymentMethod === "efectivo"
                ? selectedCurrency === "usd"
                  ? "Efectivo (USD)"
                  : "Efectivo"
                : paymentMethod === "tarjeta"
                  ? "Tarjeta"
                  : "Transferencia"
            }</span>
          </div>
          
          ${
            showChangeAmount
              ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Cambio:</span>
              <span>${changeAmount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          ¡Gracias por su compra! Visítenos pronto
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `
  }

  // Procesar pago
  const processPayment = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito para realizar una venta",
        variant: "destructive",
      })
      return
    }

    if (saleType === "telefono" && !phoneNumber) {
      toast({
        title: "Falta información",
        description: "Ingresa el número de teléfono para ventas por teléfono",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Imprimir ticket primero
      printTicket()

      // Crear objeto de venta
      const sale = {
        nombreCliente: clientName || "Cliente",
        phoneNumber: saleType === "telefono" ? phoneNumber : null,
        productos: cartItems.map((item) => ({
          productId: item.id,
          productName: item.nombre,
          precio: item.precio,
          quantity: item.quantity,
          size: item.size || "N/A",
          subtotal: item.precio * item.quantity,
        })),
        subtotal: calculateSubtotal(),
        iva: calculateTax(),
        total: calculateTotal(),
        metodoPago: paymentMethod === "efectivo" && selectedCurrency === "usd" ? "efectivo_usd" : paymentMethod,
        isDollar: selectedCurrency === "usd",
        saleType,
        fecha: new Date(),
        status: "completed",
        corteDiaCerrado: false,
      }

      console.log("Guardando venta en Firestore:", sale)

      // Guardar venta en Firestore
      await addSale(sale)

      toast({
        title: "Venta completada",
        description: `Venta por ${formatCurrency(calculateTotal())} procesada correctamente`,
      })

      // Limpiar carrito y datos de venta
      setCartItems([])
      setClientName("")
      setPhoneNumber("")
      setCashReceived("")
      setDollarAmount("")
      setShowChangeAmount(false)
      setSaleType("local")
      setPaymentMethod("efectivo")
      setSelectedCurrency("mxn")
    } catch (error) {
      console.error("Error al procesar venta:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la venta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
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

  const [cart, setCart] = useState<any[]>([])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <p className="text-muted-foreground">Gestiona ventas y pagos</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Catálogo de productos */}
        <div className="md:col-span-2 space-y-4">
          {/* Búsqueda y filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Tabs
                  defaultValue="todos"
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  className="w-full md:w-auto"
                >
                  <TabsList className="w-full overflow-auto">
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="capitalize">
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No se encontraron productos</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <div className="aspect-square bg-muted relative">
                        {product.imagenURL ? (
                          <img
                            src={product.imagenURL || "/placeholder.svg"}
                            alt={product.nombre}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/colorful-fruit-display.png"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-500">
                            {product.nombre.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium">{product.nombre}</h3>
                        <p className="text-amber-600 font-bold">{formatCurrency(product.precio)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrito y pago */}
        <div className="space-y-4">
          {/* Carrito */}
          <Card>
            <CardHeader>
              <CardTitle>Carrito</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">El carrito está vacío</p>
                  <p className="text-sm text-muted-foreground">Agrega productos para realizar una venta</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.precio)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen y pago */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-t border-gray-200 p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>

                  {taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente && (
                    <div className="flex justify-between">
                      <span>IVA ({taxConfig.porcentajeIVA}%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nombre del cliente */}
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

                  {/* Tipo de venta */}
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

                  {/* Moneda de pago */}
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

                  {/* Método de pago */}
                  <div>
                    <label className="text-sm font-medium">Método de pago</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                              <div className="text-xl font-bold text-green-700 text-right">
                                {formatCurrency(changeAmount)}
                              </div>
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
                                <div className="text-xl font-bold text-green-700 text-right">
                                  {formatCurrency(changeAmount)}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={processPayment}
                    disabled={isLoading || cartItems.length === 0 || (saleType === "telefono" && !phoneNumber)}
                  >
                    {isProcessing ? "Procesando..." : "Finalizar Venta"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
