"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getCurrencyConfig, saveCurrencyConfig, type CurrencyConfig as CurrencyConfigType } from "@/lib/config"
import { Loader2, DollarSign, Save } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface CurrencyConfigProps {
  onSuccess: (message: string) => void
}

export function CurrencyConfig({ onSuccess }: CurrencyConfigProps) {
  const [config, setConfig] = useState<CurrencyConfigType>({
    precioDolar: 17.5,
    habilitarPagosEnDolar: true,
    actualizadoEn: null,
  })

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Cargar configuración al inicio
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const currencyConfig = await getCurrencyConfig()
        setConfig(currencyConfig)

        // Formatear la fecha de última actualización si existe
        if (currencyConfig.actualizadoEn) {
          const date = new Date(currencyConfig.actualizadoEn.seconds * 1000)
          setLastUpdated(format(date, "dd/MM/yyyy HH:mm", { locale: es }))
        }
      } catch (error) {
        console.error("Error al cargar la configuración de moneda:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Manejar cambios en los inputs
  const handleChange = (field: keyof CurrencyConfigType, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Guardar configuración
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Validar campos numéricos
      const numericConfig = {
        ...config,
        precioDolar: Number(config.precioDolar),
      }

      const success = await saveCurrencyConfig(numericConfig)

      if (success) {
        // Actualizar la fecha de última actualización
        setLastUpdated(format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }))
        onSuccess("Configuración de moneda guardada correctamente")
      }
    } catch (error) {
      console.error("Error al guardar la configuración de moneda:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="mr-2 h-5 w-5" />
          Configuración de Moneda
        </CardTitle>
        <CardDescription>
          Configura el tipo de cambio para pagos en dólares
          {lastUpdated && (
            <>
              <br />
              <span className="text-xs text-muted-foreground">Última actualización: {lastUpdated}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <Label htmlFor="habilitarPagosEnDolar" className="text-base font-medium cursor-pointer">
              Habilitar pagos en dólares
            </Label>
            <p className="text-sm text-muted-foreground">Activa esta opción para aceptar pagos en dólares</p>
          </div>
          <Switch
            id="habilitarPagosEnDolar"
            checked={config.habilitarPagosEnDolar}
            onCheckedChange={(checked) => handleChange("habilitarPagosEnDolar", checked)}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="precioDolar">Tipo de cambio (MXN por USD)</Label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <Input
                id="precioDolar"
                type="number"
                value={config.precioDolar}
                onChange={(e) => handleChange("precioDolar", e.target.value)}
                min={1}
                step={0.01}
                className={`pl-8 ${!config.habilitarPagosEnDolar ? "opacity-50" : ""}`}
                disabled={!config.habilitarPagosEnDolar}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ingresa el valor de 1 dólar en pesos mexicanos</p>
          </div>

          <div className={`bg-gray-50 rounded-md p-4 mt-4 ${!config.habilitarPagosEnDolar ? "opacity-50" : ""}`}>
            <h3 className="text-sm font-medium mb-2">Vista previa de conversión:</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-2 border rounded bg-white">
                <p className="text-xs text-muted-foreground">1 USD =</p>
                <p className="text-lg font-bold">${Number(config.precioDolar).toFixed(2)} MXN</p>
              </div>
              <div className="p-2 border rounded bg-white">
                <p className="text-xs text-muted-foreground">100 MXN =</p>
                <p className="text-lg font-bold">${(100 / Number(config.precioDolar)).toFixed(2)} USD</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving} className="ml-auto bg-amber-500 hover:bg-amber-600">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Guardar Configuración
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
