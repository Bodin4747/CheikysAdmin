"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getTaxConfig, saveTaxConfig, type TaxConfig as TaxConfigType } from "@/lib/config"
import { Loader2, PercentIcon, Save, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TaxConfigProps {
  onSuccess: (message: string) => void
}

export function TaxConfig({ onSuccess }: TaxConfigProps) {
  const [config, setConfig] = useState<TaxConfigType>({
    habilitarIVA: false,
    porcentajeIVA: 16,
    aplicarIVAAutomaticamente: false,
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
        const taxConfig = await getTaxConfig()
        setConfig(taxConfig)

        // Formatear la fecha de última actualización si existe
        if (taxConfig.actualizadoEn) {
          const date = new Date(taxConfig.actualizadoEn.seconds * 1000)
          setLastUpdated(format(date, "dd/MM/yyyy HH:mm", { locale: es }))
        }
      } catch (error) {
        console.error("Error al cargar la configuración de IVA:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Manejar cambios en los inputs
  const handleChange = (field: keyof TaxConfigType, value: any) => {
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
        porcentajeIVA: Number(config.porcentajeIVA),
      }

      const success = await saveTaxConfig(numericConfig)

      if (success) {
        // Actualizar la fecha de última actualización
        setLastUpdated(format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }))
        onSuccess("Configuración de IVA guardada correctamente")
      }
    } catch (error) {
      console.error("Error al guardar la configuración de IVA:", error)
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
          <PercentIcon className="mr-2 h-5 w-5" />
          Configuración de IVA
        </CardTitle>
        <CardDescription>
          Configura cómo se aplicará el IVA en las ventas
          {lastUpdated && (
            <>
              <br />
              <span className="text-xs text-muted-foreground">Última actualización: {lastUpdated}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Importante</AlertTitle>
          <AlertDescription className="text-amber-800">
            Al habilitar el IVA, este se aplicará a todas las ventas según la configuración.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <Label htmlFor="habilitarIVA" className="text-base font-medium cursor-pointer">
                Habilitar IVA
              </Label>
              <p className="text-sm text-muted-foreground">Activa esta opción para incluir IVA en tus ventas</p>
            </div>
            <Switch
              id="habilitarIVA"
              checked={config.habilitarIVA}
              onCheckedChange={(checked) => handleChange("habilitarIVA", checked)}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="porcentajeIVA">Porcentaje de IVA (%)</Label>
              <div className="relative mt-1">
                <Input
                  id="porcentajeIVA"
                  type="number"
                  value={config.porcentajeIVA}
                  onChange={(e) => handleChange("porcentajeIVA", e.target.value)}
                  min={0}
                  max={25}
                  step={0.01}
                  disabled={!config.habilitarIVA}
                  className={!config.habilitarIVA ? "opacity-50" : ""}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">El porcentaje estándar en México es 16%</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <Label htmlFor="aplicarIVAAutomaticamente" className="cursor-pointer">
                  Aplicar IVA automáticamente
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Si se activa, el IVA se calculará e incluirá automáticamente en cada venta
                </p>
              </div>
              <Switch
                id="aplicarIVAAutomaticamente"
                checked={config.aplicarIVAAutomaticamente}
                onCheckedChange={(checked) => handleChange("aplicarIVAAutomaticamente", checked)}
                disabled={!config.habilitarIVA}
                className={`${!config.habilitarIVA ? "opacity-50" : ""} data-[state=checked]:bg-amber-500`}
              />
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
