"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import Chart from "chart.js/auto"

interface SalesData {
  date: string
  total: number
}

interface SalesChartProps {
  data: SalesData[]
  title?: string
}

export function SalesChart({ data, title = "Ventas por día" }: SalesChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Preparar los datos para el gráfico
    const labels = data.map((item) => {
      try {
        return format(parseISO(item.date), "dd/MM", { locale: es })
      } catch (e) {
        return item.date
      }
    })

    const values = data.map((item) => item.total)

    // Crear el nuevo gráfico
    const ctx = chartRef.current.getContext("2d")

    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Ventas ($)",
              data: values,
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderColor: "rgb(59, 130, 246)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => "$" + value,
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => "$" + context.parsed.y.toFixed(2),
              },
            },
          },
        },
      })
    }

    // Limpiar al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <canvas ref={chartRef} />
        </div>
      </CardContent>
    </Card>
  )
}
