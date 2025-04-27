"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, User, Phone, Minus, Plus, Trash2 } from "lucide-react"
import { getProducts } from "@/lib/firestore"
import { addSale } from "@/lib/firestore"
import { formatCurrency } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import POSProductCard from "@/components/pos-product-card"
import { getCurrencyConfig, getTaxConfig } from "@/lib/config"
import { printTicket } from "@/lib/print-ticket"
import { addOrder } from "@/lib/orders"

export default function PuntoDeVentaPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("todos")
  const [cart, setCart] = useState([])
  const [clientName, setClientName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [saleType, setSaleType] = useState("local")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("mxn")
  const [cashReceived, setCashReceived] = useState("")
  const [dollarAmount, setDollarAmount] = useState("")
  const [showChangeAmount, setShowChangeAmount] = useState(false)
  const [changeAmount, setChangeAmount] = useState(0)
  const { toast } = useToast()

  // Estados para configuraciones
  const [taxConfig, setTaxConfig] = useState({
    habilitarIVA: false,
    porcentajeIVA: 16,
    aplicarIVAAutomaticamente: false,
  })

  const [currencyConfig, setCurrencyConfig] = useState({
    precioDolar: 17.5,
    habilitarPagosEnDolar: true,
  })

  // Categorías disponibles
  const categories = [
    { id: "todos", name: "Todos", icon: "🍽️" },
    { id: "pizzas", name: "Pizzas", icon: "🍕" },
    { id: "desayunos", name: "Desayunos", icon: "🍳" },
    { id: "boneless", name: "Boneless", icon: "🍗" },
    { id: "alitas", name: "Alitas", icon: "🍗" },
    { id: "hamburguesas", name: "Hamburguesas", icon: "🍔" },
    { id: "sushi", name: "Sushi", icon: "🍣" },
    { id: "bebidas", name: "Bebidas", icon: "🥤" },
    { id: "complementos", name: "Complementos", icon: "🍟" },
    { id: "pancakes", name: "Pancakes/Waffles", icon: "🥞" },
  ]

  useEffect(() => {
    setMounted(true)

    const loadProducts = async () => {
      try {
        if (typeof window !== "undefined") {
          const productsData = await getProducts()
          setProducts(productsData)
          setFilteredProducts(productsData)
        }
      } catch (error) {
        console.error("Error al cargar productos:", error)
      } finally {
        setLoading(false)
      }
    }

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

    if (mounted) {
      loadProducts()
      loadConfigs()
    }
  }, [mounted])

  // Filtrar productos por categoría y búsqueda
  useEffect(() => {
    if (!products.length) return

    let filtered = [...products]

    // Filtrar por categoría
    if (activeCategory !== "todos") {
      if (activeCategory === "pizzas") {
        // Para pizzas, filtrar por el campo "tipo"
        filtered = filtered.filter((product) => product.tipo?.toLowerCase() === "pizza")
      } else {
        // Para otras categorías, filtrar por el campo "categoria"
        filtered = filtered.filter((product) => product.categoria?.toLowerCase() === activeCategory.toLowerCase())
      }
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((product) => product.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredProducts(filtered)
  }, [activeCategory, searchQuery, products])

  // Calcular subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0)

  // Calcular IVA si está habilitado y es automático
  let iva = 0
  if (taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente) {
    iva = subtotal * (taxConfig.porcentajeIVA / 100)
  }

  // Calcular total
  const total = subtotal + iva

  // Añadir producto al carrito
  const addToCart = (product, variant) => {
    const precio = variant?.precio || product.precio || 0
    const variantName = variant?.name || "Personal"
    const customizations = product.customizations || ""
    const observations = product.observations || ""

    // Verificar si el producto ya está en el carrito con la misma variante, personalizaciones y observaciones
    const existingItemIndex = cart.findIndex(
      (item) =>
        item.id === product.id &&
        item.variantName === variantName &&
        item.customizations === customizations &&
        item.observations === observations,
    )

    if (existingItemIndex >= 0) {
      // Incrementar cantidad si ya existe
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += 1
      setCart(updatedCart)
    } else {
      // Añadir nuevo item al carrito
      setCart([
        ...cart,
        {
          id: product.id,
          nombre: product.nombre,
          precio,
          variantName,
          quantity: 1,
          imageUrl: product.imagenURL,
          customizations,
          observations,
          withBoneless: product.withBoneless || false,
          bonelessSauce: product.bonelessSauce || null,
        },
      ])
    }

    toast({
      title: "Producto añadido",
      description: `${product.nombre} (${variantName}) añadido al carrito`,
      duration: 2000,
    })
  }

  // Eliminar producto del carrito
  const removeFromCart = (index) => {
    const updatedCart = [...cart]
    updatedCart.splice(index, 1)
    setCart(updatedCart)
  }

  // Actualizar cantidad de un producto
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return

    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
  }

  // Calcular cambio para efectivo en pesos
  const calculateChange = (value) => {
    const receivedAmount = Number.parseFloat(value || cashReceived)

    if (isNaN(receivedAmount) || receivedAmount <= 0) {
      setShowChangeAmount(false)
      return
    }

    if (receivedAmount >= total) {
      setChangeAmount(receivedAmount - total)
      setShowChangeAmount(true)
    } else {
      // Mostrar cuánto falta
      setChangeAmount(total - receivedAmount)
      setShowChangeAmount(true)
    }
  }

  // Calcular cambio para dólares
  const calculateDollarChange = (value) => {
    const receivedUSD = Number.parseFloat(value || dollarAmount)

    if (isNaN(receivedUSD) || receivedUSD <= 0) {
      setShowChangeAmount(false)
      return
    }

    const receivedMXN = receivedUSD * currencyConfig.precioDolar

    if (receivedMXN >= total) {
      setChangeAmount(receivedMXN - total)
      setShowChangeAmount(true)
    } else {
      // Mostrar cuánto falta
      setChangeAmount(total - receivedMXN)
      setShowChangeAmount(true)
    }
  }

  // Actualizar la función finalizeSale para incluir el monto recibido en el ticket
  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive",
      })
      return
    }

    try {
      // Preparar datos para el ticket
      const ticketData = {
        items: cart.map((item) => ({
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.quantity,
          subtotal: item.precio * item.quantity,
          variante: item.variantName,
          observaciones: item.observations,
          withBoneless: item.withBoneless || false,
          bonelessSauce: item.bonelessSauce || null,
        })),
        subtotal,
        total,
        clientName,
        metodoPago: selectedCurrency === "usd" ? "Efectivo (USD)" : paymentMethod,
        fecha: new Date(),
        folio: `VTA-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
        tipoVenta: saleType,
      }

      // Añadir campos opcionales solo si tienen valor
      if (saleType === "telefono" && phoneNumber) {
        ticketData.phoneNumber = phoneNumber
      }

      if (taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente) {
        ticketData.iva = iva
      }

      // Añadir monto recibido según la moneda seleccionada
      if (paymentMethod === "efectivo") {
        if (selectedCurrency === "mxn" && cashReceived) {
          ticketData.montoRecibido = Number.parseFloat(cashReceived)
        } else if (selectedCurrency === "usd" && dollarAmount) {
          // Convertir dólares a pesos para el ticket
          ticketData.montoRecibido = Number.parseFloat(dollarAmount) * currencyConfig.precioDolar
        }
      }

      if (showChangeAmount) {
        ticketData.cambio = changeAmount
      }

      // Imprimir ticket
      await printTicket(ticketData)

      // Crear objeto de venta
      const saleData = {
        nombreCliente: clientName || "Cliente sin nombre",
        productos: cart.map((item) => ({
          productId: item.id,
          productName: item.nombre,
          precio: item.precio,
          quantity: item.quantity,
          size: item.variantName,
          observations: item.observations,
          subtotal: item.precio * item.quantity,
        })),
        subtotal,
        total,
        metodoPago: selectedCurrency === "usd" ? "efectivo_usd" : paymentMethod,
        isDollar: selectedCurrency === "usd",
        saleType,
        fecha: new Date(),
        status: "completed",
        corteDiaCerrado: false,
      }

      // Si hay número de teléfono, añadirlo al objeto solo cuando existe
      if (saleType === "telefono" && phoneNumber) {
        saleData.phoneNumber = phoneNumber
      }

      // Si hay IVA habilitado y automático, añadirlo al objeto
      if (taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente) {
        saleData.iva = iva
      }

      console.log("Guardando venta en Firestore:", saleData)

      // Guardar venta en Firestore
      await addSale(saleData)

      // Crear pedido en estado pendiente
      const orderData = {
        customerName: clientName || "Cliente sin nombre",
        customerPhone: saleType === "telefono" ? phoneNumber : "",
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.nombre,
          precio: item.precio,
          quantity: item.quantity,
          size: item.variantName,
          observations: item.observations,
          subtotal: item.precio * item.quantity,
          withBoneless: item.withBoneless || false,
          bonelessSauce: item.bonelessSauce || null,
        })),
        total,
        status: "pending",
      }

      // Guardar pedido en Firestore
      await addOrder(orderData)

      toast({
        title: "Venta finalizada",
        description: `Venta por ${formatCurrency(total)} procesada correctamente`,
        variant: "default",
      })

      // Limpiar carrito y datos del cliente
      setCart([])
      setClientName("")
      setPhoneNumber("")
      setCashReceived("")
      setDollarAmount("")
      setShowChangeAmount(false)
    } catch (error) {
      console.error("Error al procesar la venta:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sección de productos */}
      <div className="flex-1 overflow-auto p-4">
        {/* Categorías */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === category.id
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar producto..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <h2 className="text-xl font-bold mb-4">Productos</h2>

        {/* Lista de productos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeCategory !== "todos"
                ? "Intenta con otra búsqueda o categoría"
                : "Añade productos desde la sección de Productos"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              return <POSProductCard key={product.id} product={product} onAddToCart={addToCart} />
            })}
          </div>
        )}
      </div>

      {/* Sección de carrito */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Resumen de Venta</h2>
        </div>

        {/* Carrito */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart size={48} className="text-gray-300 mb-2" />
              <p className="text-gray-500">No hay productos en el carrito</p>
              <p className="text-sm text-gray-400 mt-1">Haz clic en un producto para agregarlo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-xs text-gray-500">Tamaño: {item.variantName}</p>
                    {item.withBoneless && (
                      <p className="text-xs font-medium text-amber-600">
                        + BONELESS {item.bonelessSauce ? `(${item.bonelessSauce})` : ""}
                      </p>
                    )}
                    {item.customizations && (
                      <p className="text-xs text-gray-500">Personalización: {item.customizations}</p>
                    )}
                    {item.observations && <p className="text-xs text-gray-500">Observaciones: {item.observations}</p>}
                    <div className="flex items-center mt-1">
                      <button
                        className="text-gray-500 hover:text-gray-700 border rounded-l-md px-2 py-1"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="border-t border-b px-3 py-1">{item.quantity}</span>
                      <button
                        className="text-gray-500 hover:text-gray-700 border rounded-r-md px-2 py-1"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => removeFromCart(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="font-medium">{formatCurrency(item.precio * item.quantity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de venta */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <p className="text-gray-500">Subtotal:</p>
              <p className="font-medium">{formatCurrency(subtotal)}</p>
            </div>

            {taxConfig.habilitarIVA && taxConfig.aplicarIVAAutomaticamente && (
              <div className="flex justify-between mb-2">
                <p className="text-gray-500">IVA ({taxConfig.porcentajeIVA}%):</p>
                <p className="font-medium">{formatCurrency(iva)}</p>
              </div>
            )}

            <div className="flex justify-between">
              <p className="text-gray-500">Total:</p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="mb-4">
            <label className="block text-gray-500 mb-2">Nombre del cliente</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Nombre del cliente"
                className="pl-10"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Tipo de venta */}
          <div className="mb-4">
            <label className="block text-gray-500 mb-2">Tipo de venta</label>
            <div className="grid grid-cols-2 gap-2">
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
            <div className="mb-4">
              <label className="block text-gray-500 mb-2">Número de teléfono</label>
              <Input
                type="tel"
                placeholder="10 dígitos"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          {/* Selector de moneda - Solo visible si está habilitado en configuración */}
          {currencyConfig.habilitarPagosEnDolar && (
            <div className="mb-4">
              <label className="block text-gray-500 mb-2">Moneda de pago</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedCurrency === "mxn" ? "default" : "outline"}
                  className={selectedCurrency === "mxn" ? "bg-amber-500 hover:bg-amber-600" : ""}
                  onClick={() => {
                    setSelectedCurrency("mxn")
                    setDollarAmount("")
                    setShowChangeAmount(false)
                  }}
                >
                  MXN (Pesos)
                </Button>
                <Button
                  type="button"
                  variant={selectedCurrency === "usd" ? "default" : "outline"}
                  className={selectedCurrency === "usd" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  onClick={() => {
                    setSelectedCurrency("usd")
                    setCashReceived("")
                    setShowChangeAmount(false)
                  }}
                >
                  USD (Dólares)
                </Button>
              </div>
            </div>
          )}

          {/* Método de pago */}
          <div className="mb-4">
            <label className="block text-gray-500 mb-2">Método de pago</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          {/* Opciones específicas para pago en efectivo */}
          {paymentMethod === "efectivo" && (
            <div className="mb-4">
              {selectedCurrency === "mxn" ? (
                <>
                  <label className="block text-gray-500 mb-2">Efectivo recibido (MXN)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => {
                      setCashReceived(e.target.value)
                      calculateChange(e.target.value)
                    }}
                  />
                </>
              ) : (
                <>
                  <label className="block text-gray-500 mb-2">Dólares recibidos (USD)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={dollarAmount}
                    onChange={(e) => {
                      setDollarAmount(e.target.value)
                      calculateDollarChange(e.target.value)
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tipo de cambio: 1 USD = {formatCurrency(currencyConfig.precioDolar)}
                  </p>
                </>
              )}

              {showChangeAmount && (
                <div
                  className={`mt-2 p-2 rounded-md ${
                    (selectedCurrency === "mxn" && Number(cashReceived) >= total) ||
                    (selectedCurrency === "usd" && Number(dollarAmount) * currencyConfig.precioDolar >= total)
                      ? "bg-green-50"
                      : "bg-amber-50"
                  }`}
                >
                  {(selectedCurrency === "mxn" && Number(cashReceived) >= total) ||
                  (selectedCurrency === "usd" && Number(dollarAmount) * currencyConfig.precioDolar >= total) ? (
                    <>
                      <p className="text-sm font-medium text-green-700">Cambio a devolver:</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(changeAmount)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-amber-700">Falta por cubrir:</p>
                      <p className="text-lg font-bold text-amber-700">{formatCurrency(changeAmount)}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botón finalizar venta */}
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3"
            disabled={
              cart.length === 0 ||
              (saleType === "telefono" && !phoneNumber) ||
              (paymentMethod === "efectivo" && selectedCurrency === "mxn" && Number(cashReceived) < total) ||
              (paymentMethod === "efectivo" &&
                selectedCurrency === "usd" &&
                Number(dollarAmount) * currencyConfig.precioDolar < total)
            }
            onClick={finalizeSale}
          >
            Finalizar Venta
          </Button>
        </div>
      </div>
    </div>
  )
}
