"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PrinterConfig } from "./printer-config"
import { TaxConfig } from "./tax-config"
import { CurrencyConfig } from "./currency-config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const ConfiguracionPage = () => {
  const [activeTab, setActiveTab] = useState("impresora")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { toast } = useToast()

  // Efecto para ocultar el mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  const handleSuccessSave = (message: string) => {
    toast({
      title: "Guardado correctamente",
      description: message,
      duration: 3000,
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-2">Configuración</h1>
      <p className="text-muted-foreground mb-6">Ajusta la configuración del sistema según tus necesidades</p>

      {saveSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Guardado correctamente</AlertTitle>
          <AlertDescription className="text-green-600">Los cambios han sido guardados correctamente.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="impresora" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="impresora">Configuración de Tickets</TabsTrigger>
          <TabsTrigger value="iva">Configuración de IVA</TabsTrigger>
          <TabsTrigger value="moneda">Configuración de Moneda</TabsTrigger>
        </TabsList>

        <TabsContent value="impresora" className="mt-6">
          <PrinterConfig onSuccess={(message) => handleSuccessSave(message)} />
        </TabsContent>

        <TabsContent value="iva" className="mt-6">
          <TaxConfig onSuccess={(message) => handleSuccessSave(message)} />
        </TabsContent>

        <TabsContent value="moneda" className="mt-6">
          <CurrencyConfig onSuccess={(message) => handleSuccessSave(message)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ConfiguracionPage
