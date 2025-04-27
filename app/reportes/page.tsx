"use client"

import { useState, useEffect } from "react"
import { DollarSign, ShoppingCart, Printer, FileSpreadsheet, FileIcon as FilePdf, Check } from "lucide-react"
import {
  getSalesByDateRange,
  getProductStatsByCategory,
  getPizzaSizeStats,
  exportToExcel,
  exportToPDF,
  formatSalesForExport,
  formatProductStatsForExport,
  type Sale,
  type ProductStats,
  type SizeStats,
} from "@/lib/reports"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "@/contexts/auth-context"
import { getCortes, realizarCorte, type Corte } from "@/lib/cortes"
import { Bar, Pie } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Badge } from "@/components/ui/badge"

// Registrar componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function ReportesPage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("corte-diario")
  const [startDate, setStartDate] = useState(formatDate(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(formatDate(new Date(), "yyyy-MM-dd"))
  const [paymentMethod, setPaymentMethod] = useState("todos")
  const [salesData, setSalesData] = useState<any>({
    total: 0,
    count: 0,
    byPaymentMethod: {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
    },
    byDollar: {
      dollar: 0,
      peso: 0,
    },
    items: [],
  })

  // Estado para datos analíticos
  const [pizzaStats, setPizzaStats] = useState<ProductStats[]>([])
  const [sizeStats, setSizeStats] = useState<SizeStats[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("pizza")

  // Estado para cortes
  const [cortes, setCortes] = useState<Corte[]>([])
  const [isLoadingCortes, setIsLoadingCortes] = useState(false)
  const [realizandoCorte, setRealizandoCorte] = useState(false)
  const [corteExitoso, setCorteExitoso] = useState(false)

  // Estado para ventas detalladas
  const [salesDetails, setSalesDetails] = useState<Sale[]>([])
  const [expandedSale, setExpandedSale] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)

    const loadReportData = async () => {
      try {
        if (typeof window !== "undefined") {
          setLoading(true)
          console.log("Cargando datos de ventas para fechas:", startDate, endDate) // Depuración

          // Cargar datos de ventas por rango de fechas
          const salesData = await getSalesByDateRange(startDate, endDate, paymentMethod)
          console.log("Datos de ventas obtenidos:", salesData) // Depuración

          setSalesData(salesData)
          setSalesDetails(salesData.items || [])
        }
      } catch (error) {
        console.error("Error al cargar datos del reporte:", error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadReportData()
    }
  }, [startDate, endDate, paymentMethod, mounted])

  useEffect(() => {
    const loadCortesData = async () => {
      if (activeTab === "historial-cortes") {
        setIsLoadingCortes(true)
        try {
          const cortesData = await getCortes()
          setCortes(cortesData)
        } catch (error) {
          console.error("Error al cargar cortes:", error)
        } finally {
          setIsLoadingCortes(false)
        }
      }
    }

    const loadAnalytics = async () => {
      if (activeTab === "dashboard-analitico") {
        setLoading(true)
        try {
          const start = new Date(startDate)
          const end = new Date(endDate)

          // Obtener estadísticas de pizzas - cambiado "Pizza" por "pizza"
          const pizzas = await getProductStatsByCategory(start, end, "pizza")
          setPizzaStats(pizzas)
          console.log("Estadísticas de pizzas:", pizzas)

          // Obtener estadísticas de tamaños
          const sizes = await getPizzaSizeStats(start, end)
          setSizeStats(sizes)
          console.log("Estadísticas de tamaños:", sizes)
        } catch (error) {
          console.error("Error al cargar datos analíticos:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (mounted) {
      loadCortesData()
      loadAnalytics()
    }
  }, [activeTab, startDate, endDate, mounted, selectedCategory])

  // Actualizar la función handleDateRangeSearch para incluir más logs de depuración
  const handleDateRangeSearch = async () => {
    try {
      setLoading(true)
      console.log("Buscando ventas para fechas:", startDate, endDate)
      console.log("Método de pago seleccionado:", paymentMethod)

      const start = new Date(startDate)
      const end = new Date(endDate)
      console.log("Fechas convertidas:", start, end)

      const data = await getSalesByDateRange(start, end, paymentMethod === "todos" ? undefined : paymentMethod)

      console.log("Resultados de búsqueda:", data)
      console.log("Número de ventas encontradas:", data.items?.length || 0)

      setSalesData(data)
      setSalesDetails(data.items || [])

      if (activeTab === "dashboard-analitico") {
        console.log("Cargando datos analíticos...")

        // Obtener estadísticas de pizzas - cambiado "Pizza" por "pizza"
        console.log("Obteniendo estadísticas de pizzas...")
        const pizzas = await getProductStatsByCategory(start, end, "pizza")
        console.log("Estadísticas de pizzas obtenidas:", pizzas.length)
        setPizzaStats(pizzas)

        // Obtener estadísticas de tamaños
        console.log("Obteniendo estadísticas de tamaños...")
        const sizes = await getPizzaSizeStats(start, end)
        console.log("Estadísticas de tamaños obtenidas:", sizes.length)
        setSizeStats(sizes)
      }
    } catch (error) {
      console.error("Error al buscar ventas por rango de fechas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcelVentas = () => {
    if (salesData.items && salesData.items.length > 0) {
      const formattedData = formatSalesForExport(salesData.items)
      exportToExcel(formattedData, `ventas_${format(new Date(), "yyyy-MM-dd")}`)
    } else {
      alert("No hay datos para exportar")
    }
  }

  const handleExportPDFVentas = () => {
    if (salesData.items && salesData.items.length > 0) {
      const formattedData = formatSalesForExport(salesData.items)
      exportToPDF(
        formattedData,
        `Reporte de Ventas (${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")})`,
        `ventas_${format(new Date(), "yyyy-MM-dd")}`,
      )
    } else {
      alert("No hay datos para exportar")
    }
  }

  const handleExportExcelProductos = () => {
    if (pizzaStats && pizzaStats.length > 0) {
      const formattedData = formatProductStatsForExport(pizzaStats)
      exportToExcel(formattedData, `pizzas_${format(new Date(), "yyyy-MM-dd")}`)
    } else {
      alert("No hay datos para exportar")
    }
  }

  const handleExportPDFProductos = () => {
    if (pizzaStats && pizzaStats.length > 0) {
      const formattedData = formatProductStatsForExport(pizzaStats)
      exportToPDF(
        formattedData,
        `Reporte de Pizzas (${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")})`,
        `pizzas_${format(new Date(), "yyyy-MM-dd")}`,
      )
    } else {
      alert("No hay datos para exportar")
    }
  }

  const handleRealizarCorte = async () => {
    try {
      setRealizandoCorte(true)
      await realizarCorte(user)
      setCorteExitoso(true)

      // Recargar cortes
      const cortesData = await getCortes()
      setCortes(cortesData)

      setTimeout(() => setCorteExitoso(false), 3000)
    } catch (error) {
      console.error("Error al realizar corte:", error)
      alert("Error al realizar corte")
    } finally {
      setRealizandoCorte(false)
    }
  }

  const toggleExpandSale = (saleId: string) => {
    if (expandedSale === saleId) {
      setExpandedSale(null)
    } else {
      setExpandedSale(saleId)
    }
  }

  if (!mounted) {
    return null
  }

  // Preparar datos para gráficos
  const pizzaChartData = {
    labels: pizzaStats.slice(0, 10).map((p) => p.nombre),
    datasets: [
      {
        label: "Unidades vendidas",
        data: pizzaStats.slice(0, 10).map((p) => p.cantidad),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  }

  const sizeChartData = {
    labels: sizeStats.map((s) => s.size),
    datasets: [
      {
        data: sizeStats.map((s) => s.cantidad),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  // Opciones para los gráficos
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Pizzas más vendidas",
      },
    },
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Ventas por tamaño de pizza",
      },
    },
  }

  // Función para obtener el color del badge según el método de pago
  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "efectivo":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "tarjeta":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "transferencia":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Visualiza y analiza las ventas de tu negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcelVentas} className="gap-1">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDFVentas} className="gap-1">
            <FilePdf className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="corte-diario" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="corte-diario">Corte Diario</TabsTrigger>
          <TabsTrigger value="historial-cortes">Historial de Cortes</TabsTrigger>
          <TabsTrigger value="dashboard-analitico">Dashboard Analítico</TabsTrigger>
        </TabsList>

        <TabsContent value="corte-diario" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Corte Diario</CardTitle>
              <Button
                onClick={handleRealizarCorte}
                disabled={realizandoCorte}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {realizandoCorte ? "Procesando..." : "Realizar Corte"}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">Visualiza y filtra las ventas del día.</p>

              {corteExitoso && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  <span>¡Corte realizado con éxito!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Ventas</p>
                        <h3 className="text-2xl font-bold">{formatCurrency(salesData.total)}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Número de Ventas</p>
                        <h3 className="text-2xl font-bold">{salesData.count}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                        <h3 className="text-2xl font-bold">
                          {salesData.count > 0 ? formatCurrency(salesData.total / salesData.count) : formatCurrency(0)}
                        </h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                        <Receipt className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución por Método de Pago</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Efectivo</span>
                      </div>
                      <span className="font-medium">{formatCurrency(salesData.byPaymentMethod.efectivo)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span>Tarjeta</span>
                      </div>
                      <span className="font-medium">{formatCurrency(salesData.byPaymentMethod.tarjeta)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span>Transferencia</span>
                      </div>
                      <span className="font-medium">{formatCurrency(salesData.byPaymentMethod.transferencia)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución por Moneda</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <span>Pesos</span>
                      </div>
                      <span className="font-medium">{formatCurrency(salesData.byDollar?.peso || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Dólares</span>
                      </div>
                      <span className="font-medium">${salesData.byDollar?.dollar || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Ventas del día</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium">Fecha inicio</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha fin</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Método de pago</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleDateRangeSearch} className="w-full mb-6">
                  Buscar
                </Button>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Método de Pago</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Detalles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : salesDetails && salesDetails.length > 0 ? (
                          salesDetails.map((sale: any) => (
                            <>
                              <TableRow
                                key={sale.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpandSale(sale.id)}
                              >
                                <TableCell>{format(sale.fecha, "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                                <TableCell>{sale.nombreCliente || "Cliente"}</TableCell>
                                <TableCell>{sale.clientPhone || "N/A"}</TableCell>
                                <TableCell>
                                  {sale.isDollar ? "$" : ""}
                                  {formatCurrency(sale.total, sale.isDollar ? "USD" : "MXN")}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getPaymentMethodColor(sale.metodoPago)}>{sale.metodoPago}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={sale.isDollar ? "default" : "outline"}>
                                    {sale.isDollar ? "Dólares" : "Pesos"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm">
                                    {expandedSale === sale.id ? "Ocultar" : "Ver"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedSale === sale.id && (
                                <TableRow>
                                  <TableCell colSpan={7} className="bg-gray-50 p-4">
                                    <div className="text-sm">
                                      <h4 className="font-medium mb-2">Productos:</h4>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Precio</TableHead>
                                            <TableHead>Tamaño</TableHead>
                                            <TableHead>Subtotal</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {sale.productos && sale.productos.length > 0 ? (
                                            sale.productos.map((item, idx) => (
                                              <TableRow key={`${sale.id}-item-${idx}`}>
                                                <TableCell>{item.productName}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                  {sale.isDollar ? "$" : ""}
                                                  {formatCurrency(item.precio, sale.isDollar ? "USD" : "MXN")}
                                                </TableCell>
                                                <TableCell>{item.size || "N/A"}</TableCell>
                                                <TableCell>
                                                  {sale.isDollar ? "$" : ""}
                                                  {formatCurrency(item.subtotal, sale.isDollar ? "USD" : "MXN")}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          ) : (
                                            <TableRow>
                                              <TableCell colSpan={5} className="text-center py-2">
                                                No hay productos
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                              No hay ventas para mostrar
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Imprimir reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial-cortes" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cortes</CardTitle>
              <CardDescription>Visualiza los cortes de caja realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium">Fecha inicio</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha fin</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDateRangeSearch} className="w-full">
                    Buscar
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Cortes Realizados</h3>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Ventas</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Efectivo</TableHead>
                          <TableHead>Tarjeta</TableHead>
                          <TableHead>Transferencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingCortes ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : cortes && cortes.length > 0 ? (
                          cortes.map((corte) => (
                            <TableRow key={corte.id}>
                              <TableCell>{format(corte.fecha, "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                              <TableCell>{corte.usuario}</TableCell>
                              <TableCell>{corte.cantidadVentas}</TableCell>
                              <TableCell>{formatCurrency(corte.totalVentas)}</TableCell>
                              <TableCell>{formatCurrency(corte.totalEfectivo)}</TableCell>
                              <TableCell>{formatCurrency(corte.totalTarjeta)}</TableCell>
                              <TableCell>{formatCurrency(corte.totalTransferencia)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                              No hay cortes para mostrar
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (cortes && cortes.length > 0) {
                      const formattedData = cortes.map((corte) => ({
                        Fecha: format(corte.fecha, "dd/MM/yyyy HH:mm", { locale: es }),
                        Usuario: corte.usuario,
                        "Cantidad de Ventas": corte.cantidadVentas,
                        "Total Ventas": corte.totalVentas,
                        "Total Efectivo": corte.totalEfectivo,
                        "Total Tarjeta": corte.totalTarjeta,
                        "Total Transferencia": corte.totalTransferencia,
                      }))
                      exportToExcel(formattedData, `cortes_${format(new Date(), "yyyy-MM-dd")}`)
                    } else {
                      alert("No hay datos para exportar")
                    }
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (cortes && cortes.length > 0) {
                      const formattedData = cortes.map((corte) => ({
                        Fecha: format(corte.fecha, "dd/MM/yyyy HH:mm", { locale: es }),
                        Usuario: corte.usuario,
                        "Cantidad de Ventas": corte.cantidadVentas,
                        "Total Ventas": corte.totalVentas,
                        "Total Efectivo": corte.totalEfectivo,
                        "Total Tarjeta": corte.totalTarjeta,
                        "Total Transferencia": corte.totalTransferencia,
                      }))
                      exportToPDF(formattedData, `Historial de Cortes`, `cortes_${format(new Date(), "yyyy-MM-dd")}`)
                    } else {
                      alert("No hay datos para exportar")
                    }
                  }}
                >
                  <FilePdf className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard-analitico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Analítico</CardTitle>
              <CardDescription>Análisis de ventas por productos y tamaños</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium">Fecha inicio</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Fecha fin</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDateRangeSearch} className="w-full">
                    Analizar
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de pizzas más vendidas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pizzas más vendidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pizzaStats && pizzaStats.length > 0 ? (
                        <div className="h-80">
                          <Bar options={barOptions} data={pizzaChartData} />
                        </div>
                      ) : (
                        <p className="text-center py-8 text-muted-foreground">No hay datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Gráfico de tamaños de pizza más vendidos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tamaños de pizza más vendidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sizeStats && sizeStats.length > 0 ? (
                        <div className="h-80">
                          <Pie options={pieOptions} data={sizeChartData} />
                        </div>
                      ) : (
                        <p className="text-center py-8 text-muted-foreground">No hay datos disponibles</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Listado de pizzas más vendidas */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Pizzas más vendidas</h3>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pizza</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Total Vendido</TableHead>
                          <TableHead>Categoría</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : pizzaStats && pizzaStats.length > 0 ? (
                          pizzaStats.slice(0, 10).map((pizza) => (
                            <TableRow key={pizza.id}>
                              <TableCell>{pizza.nombre}</TableCell>
                              <TableCell>{pizza.cantidad}</TableCell>
                              <TableCell>{formatCurrency(pizza.total)}</TableCell>
                              <TableCell>{pizza.categoria || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No hay datos para mostrar
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Listado de tamaños de pizza más vendidos */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Tamaños de pizza más vendidos</h3>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tamaño</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Total Vendido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : sizeStats && sizeStats.length > 0 ? (
                          sizeStats.map((size) => (
                            <TableRow key={size.size}>
                              <TableCell>{size.size}</TableCell>
                              <TableCell>{size.cantidad}</TableCell>
                              <TableCell>{formatCurrency(size.total)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                              No hay datos para mostrar
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" className="gap-2" onClick={handleExportExcelProductos}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleExportPDFProductos}>
                  <FilePdf className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
