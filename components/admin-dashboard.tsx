"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Pizza,
  Coffee,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getTopProducts, getRecentSales, getDailySales } from "@/lib/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SalesChart } from "@/components/sales-chart"
import { DateRangePicker } from "@/components/date-range-picker"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"

// Datos de ejemplo para el gráfico
const demoChartData = [
  { date: "2023-05-01", total: 1200 },
  { date: "2023-05-02", total: 1800 },
  { date: "2023-05-03", total: 2200 },
  { date: "2023-05-04", total: 1500 },
  { date: "2023-05-05", total: 2500 },
  { date: "2023-05-06", total: 2800 },
  { date: "2023-05-07", total: 3200 },
]

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [todaySales, setTodaySales] = useState({ count: 0, total: 0, byPaymentMethod: {} })
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  useEffect(() => {
    setMounted(true)

    const loadData = async () => {
      try {
        // Cargar datos solo del lado del cliente
        if (typeof window !== "undefined") {
          setLoading(true)
          console.log("Cargando datos del dashboard...")

          // Intentar cargar ventas recientes primero
          console.log("Cargando ventas recientes...")
          const salesData = await getRecentSales(5)
          console.log("Ventas recientes obtenidas:", salesData)
          setRecentSales(salesData)

          // Luego cargar productos más vendidos
          console.log("Cargando productos más vendidos...")
          const productsData = await getTopProducts(5)
          console.log("Productos más vendidos obtenidos:", productsData)
          setProducts(productsData)

          // Finalmente cargar ventas del día
          console.log("Cargando ventas del día...")
          const dailyData = await getDailySales()
          console.log("Ventas del día obtenidas:", dailyData)
          setTodaySales(dailyData)

          setLoading(false)
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error)
        setLoading(false)
      }
    }

    if (mounted) {
      loadData()
    }
  }, [mounted])

  // Calcular el porcentaje de cambio (simulado para demostración)
  const calculateChange = (value) => {
    // En un caso real, esto compararía con datos históricos
    const randomChange = Math.random() * 20 - 10 // Entre -10% y +10%
    return {
      value: randomChange.toFixed(1),
      positive: randomChange > 0,
    }
  }

  const salesChange = calculateChange(todaySales.total)
  const ordersChange = calculateChange(todaySales.count)

  if (!mounted) return null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado con fecha actual */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">{format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Descargar Reporte
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600" size="sm">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Ventas del día */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventas del día</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(todaySales.total)}</CardTitle>
            <div className={`text-xs flex items-center ${salesChange.positive ? "text-green-600" : "text-red-600"}`}>
              {salesChange.positive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>{salesChange.value}% respecto a ayer</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-10 flex items-center">
              <DollarSign className="h-8 w-8 text-amber-500 bg-amber-100 p-1.5 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Órdenes del día */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Órdenes del día</CardDescription>
            <CardTitle className="text-2xl">{todaySales.count}</CardTitle>
            <div className={`text-xs flex items-center ${ordersChange.positive ? "text-green-600" : "text-red-600"}`}>
              {ordersChange.positive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              <span>{ordersChange.value}% respecto a ayer</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-10 flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-500 bg-blue-100 p-1.5 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Ticket promedio */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket promedio</CardDescription>
            <CardTitle className="text-2xl">
              {todaySales.count > 0 ? formatCurrency(todaySales.total / todaySales.count) : formatCurrency(0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-10 flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500 bg-green-100 p-1.5 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Clientes del día */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clientes del día</CardDescription>
            <CardTitle className="text-2xl">{todaySales.count}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-10 flex items-center">
              <Users className="h-8 w-8 text-purple-500 bg-purple-100 p-1.5 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de ventas y productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de ventas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ventas</CardTitle>
                <CardDescription>Análisis de ventas por período</CardDescription>
              </div>
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            </CardHeader>
            <CardContent>
              <SalesChart data={demoChartData} />
            </CardContent>
          </Card>
        </div>

        {/* Productos más vendidos */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pizzas más vendidas</CardTitle>
              <CardDescription>Top 5 pizzas del período</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-6">
                  {products.map((product, index) => (
                    <div key={product.id || index} className="flex items-center gap-4">
                      <div className="flex-none flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.nombre}</p>
                        <p className="text-sm text-gray-500">{product.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(product.precio)}</p>
                        <p className="text-xs text-gray-500">{product.ventas || 0} vendidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No hay datos disponibles</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secciones inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por categoría</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <span>Pizzas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.total * 0.6)}</span>
                  <span className="text-xs text-gray-500">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Bebidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.total * 0.2)}</span>
                  <span className="text-xs text-gray-500">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Complementos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.total * 0.15)}</span>
                  <span className="text-xs text-gray-500">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span>Otros</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.total * 0.05)}</span>
                  <span className="text-xs text-gray-500">5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ventas por método de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de pago</CardTitle>
            <CardDescription>Distribución por forma de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Efectivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.byPaymentMethod?.efectivo || 0)}</span>
                  <span className="text-xs text-gray-500">
                    {todaySales.total > 0
                      ? Math.round(((todaySales.byPaymentMethod?.efectivo || 0) / todaySales.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Tarjeta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.byPaymentMethod?.tarjeta || 0)}</span>
                  <span className="text-xs text-gray-500">
                    {todaySales.total > 0
                      ? Math.round(((todaySales.byPaymentMethod?.tarjeta || 0) / todaySales.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span>Transferencia</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatCurrency(todaySales.byPaymentMethod?.transferencia || 0)}</span>
                  <span className="text-xs text-gray-500">
                    {todaySales.total > 0
                      ? Math.round(((todaySales.byPaymentMethod?.transferencia || 0) / todaySales.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ventas recientes */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas recientes</CardTitle>
            <CardDescription>Últimas transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale, index) => (
                  <div key={sale.id || index} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{sale.clientName || "Cliente"}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        <span>
                          {sale.date && typeof sale.date.getHours === "function"
                            ? format(sale.date, "HH:mm")
                            : "Hace 30 min"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-gray-500 capitalize">{sale.paymentMethod || "Efectivo"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No hay ventas recientes</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
            <a href="/punto-de-venta">
              <ShoppingBag className="h-6 w-6 text-amber-500" />
              <span>Punto de Venta</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
            <a href="/productos">
              <Pizza className="h-6 w-6 text-blue-500" />
              <span>Productos</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
            <a href="/reportes">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <span>Reportes</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" asChild>
            <a href="/pedidos">
              <Coffee className="h-6 w-6 text-purple-500" />
              <span>Pedidos</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
