"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getPrinterConfig, savePrinterConfig, type PrinterConfig as PrinterConfigType } from "@/lib/config"
import { Loader2, Printer, Save, FileText, Eye } from "lucide-react"
import { previewTicket } from "@/lib/print-ticket"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PrinterConfigProps {
  onSuccess: (message: string) => void
}

export function PrinterConfig({ onSuccess }: PrinterConfigProps) {
  const [config, setConfig] = useState<PrinterConfigType>({
    nombreImpresora: "",
    direccionIP: "",
    puertoIP: "9100",
    puertoImpresora: "",
    dpi: 203,
    anchoTicket: 58,
    copias: 1,
    cortarPapel: true,
    imprimirCajero: true,
    imprimirFecha: true,
    mostrarLogo: true,
    textoEncabezado: "Cheikys Pizza\nDirección: Constitución #123\nTel: 555-123-4567",
    textoPie: "¡Gracias por su compra! Visítenos pronto",
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
        const printerConfig = await getPrinterConfig()
        setConfig(printerConfig)

        // Formatear la fecha de última actualización si existe
        if (printerConfig.actualizadoEn) {
          const date = new Date(printerConfig.actualizadoEn.seconds * 1000)
          setLastUpdated(format(date, "dd/MM/yyyy HH:mm", { locale: es }))
        }
      } catch (error) {
        console.error("Error al cargar la configuración:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  // Manejar cambios en los inputs
  const handleChange = (field: keyof PrinterConfigType, value: any) => {
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
        dpi: Number(config.dpi),
        anchoTicket: Number(config.anchoTicket),
        copias: Number(config.copias),
      }

      const success = await savePrinterConfig(numericConfig)

      if (success) {
        // Actualizar la fecha de última actualización
        setLastUpdated(format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }))
        onSuccess("Configuración de tickets guardada correctamente")
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Vista previa del ticket
  const handlePreview = async () => {
    const sampleTicket = {
      items: [
        {
          nombre: "Pizza Hawaiana",
          precio: 199.0,
          cantidad: 1,
          subtotal: 199.0,
          variante: "Grande",
        },
        {
          nombre: "Refresco",
          precio: 30.0,
          cantidad: 2,
          subtotal: 60.0,
        },
        {
          nombre: "Alitas BBQ",
          precio: 120.0,
          cantidad: 1,
          subtotal: 120.0,
        },
      ],
      subtotal: 379.0,
      iva: 60.64,
      total: 439.64,
      clientName: "Cliente de Ejemplo",
      cajero: "Vendedor",
      fecha: new Date(),
      metodoPago: "Efectivo",
      cambio: 60.36,
      folio: "VTA-0001",
    }

    await previewTicket(sampleTicket)
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
          <Printer className="mr-2 h-5 w-5" />
          Configuración de Tickets
        </CardTitle>
        <CardDescription>
          Configura cómo se imprimirán los tickets de venta
          {lastUpdated && (
            <>
              <br />
              <span className="text-xs text-muted-foreground">Última actualización: {lastUpdated}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección de contenido del ticket */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Contenido del Ticket
            </h3>

            <div className="space-y-2">
              <Label htmlFor="textoEncabezado">Texto de Encabezado</Label>
              <Textarea
                id="textoEncabezado"
                placeholder="Nombre de la empresa, dirección, etc."
                value={config.textoEncabezado}
                onChange={(e) => handleChange("textoEncabezado", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Este texto aparecerá en la parte superior del ticket.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textoPie">Texto de Pie</Label>
              <Textarea
                id="textoPie"
                placeholder="Mensaje de agradecimiento, redes sociales, etc."
                value={config.textoPie}
                onChange={(e) => handleChange("textoPie", e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Este texto aparecerá en la parte inferior del ticket.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anchoTicket">Ancho del Ticket (mm)</Label>
              <Input
                id="anchoTicket"
                type="number"
                value={config.anchoTicket}
                onChange={(e) => handleChange("anchoTicket", e.target.value)}
                min={30}
                max={80}
              />
              <p className="text-xs text-muted-foreground">Ancho estándar: 58mm o 80mm para tickets térmicos.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="copias">Número de Copias</Label>
                <Input
                  id="copias"
                  type="number"
                  value={config.copias}
                  onChange={(e) => handleChange("copias", e.target.value)}
                  min={1}
                  max={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpi">DPI de Impresión</Label>
                <Input
                  id="dpi"
                  type="number"
                  value={config.dpi}
                  onChange={(e) => handleChange("dpi", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sección de opciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Opciones de Impresión</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <Label htmlFor="mostrarLogo" className="cursor-pointer flex-1">
                  Mostrar Logo
                </Label>
                <Switch
                  id="mostrarLogo"
                  checked={config.mostrarLogo}
                  onCheckedChange={(checked) => handleChange("mostrarLogo", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <Label htmlFor="imprimirCajero" className="cursor-pointer flex-1">
                  Imprimir Nombre del Cajero
                </Label>
                <Switch
                  id="imprimirCajero"
                  checked={config.imprimirCajero}
                  onCheckedChange={(checked) => handleChange("imprimirCajero", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <Label htmlFor="imprimirFecha" className="cursor-pointer flex-1">
                  Imprimir Fecha y Hora
                </Label>
                <Switch
                  id="imprimirFecha"
                  checked={config.imprimirFecha}
                  onCheckedChange={(checked) => handleChange("imprimirFecha", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                <Label htmlFor="cortarPapel" className="cursor-pointer flex-1">
                  Cortar Papel (si la impresora lo soporta)
                </Label>
                <Switch
                  id="cortarPapel"
                  checked={config.cortarPapel}
                  onCheckedChange={(checked) => handleChange("cortarPapel", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-medium">Detalles Técnicos (Opcional)</h3>
            <p className="text-xs text-muted-foreground mb-2">Solo necesario para impresoras térmicas de red.</p>

            <div className="space-y-2">
              <Label htmlFor="nombreImpresora">Nombre de la Impresora</Label>
              <Input
                id="nombreImpresora"
                placeholder="Nombre de la impresora (opcional)"
                value={config.nombreImpresora}
                onChange={(e) => handleChange("nombreImpresora", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccionIP">Dirección IP</Label>
              <Input
                id="direccionIP"
                placeholder="192.168.1.100"
                value={config.direccionIP}
                onChange={(e) => handleChange("direccionIP", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="puertoIP">Puerto IP</Label>
                <Input
                  id="puertoIP"
                  placeholder="9100"
                  value={config.puertoIP}
                  onChange={(e) => handleChange("puertoIP", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="puertoImpresora">Puerto de Impresora</Label>
                <Input
                  id="puertoImpresora"
                  placeholder="(opcional)"
                  value={config.puertoImpresora}
                  onChange={(e) => handleChange("puertoImpresora", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePreview} disabled={isSaving}>
          <Eye className="h-4 w-4 mr-2" /> Vista previa
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600">
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
