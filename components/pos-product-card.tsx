"use client"

import { useState } from "react"
import { Pizza } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

export default function POSProductCard({ product, onAddToCart }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [withBoneless, setWithBoneless] = useState(false)
  const [selectedSauce, setSelectedSauce] = useState("bbq")
  const [showObservations, setShowObservations] = useState(false)
  const [observations, setObservations] = useState("")
  const [selectedBoneless, setSelectedBoneless] = useState(false) // Añadir estado para boneless

  // Precio adicional por boneless (editable)
  const [bonelessPrice, setBonelessPrice] = useState(50)

  // Determinar si el producto es una pizza
  const isPizza = product.tipo?.toLowerCase() === "pizza"

  // Determinar si el producto tiene variantes
  const hasVariants = isPizza && product.prices && Object.keys(product.prices).length > 0

  // Obtener el precio base o el precio mínimo de las variantes
  const basePrice = hasVariants ? Math.min(...Object.values(product.prices)) : product.precio || 0

  // Manejar clic en el producto
  const handleProductClick = () => {
    if (isPizza) {
      // Si es pizza, abrir diálogo de selección
      setIsDialogOpen(true)
      setSelectedVariant(null)
      setWithBoneless(false)
      setSelectedSauce("bbq")
      setShowObservations(false)
      setObservations("")
      setSelectedBoneless(false) // Reset boneless selection
    } else if (hasVariants) {
      // Si tiene variantes pero no es pizza, abrir diálogo
      setIsDialogOpen(true)
      setSelectedVariant(null)
      setShowObservations(false)
      setObservations("")
    } else {
      // Si no tiene variantes, añadir directamente
      onAddToCart(product)
    }
  }

  // Añadir variante seleccionada
  const addSelectedVariant = () => {
    if (selectedVariant) {
      // Calcular precio final con boneless si aplica
      let finalPrice = selectedVariant.price
      let customizations = ""

      if (isPizza) {
        if (withBoneless) {
          finalPrice += bonelessPrice
          customizations = `Con boneless (Salsa ${getSauceName(selectedSauce)})`
        }
      }

      // Crear objeto con información adicional
      const productInfo = {
        ...product,
        precio: finalPrice,
        variantName: selectedVariant.name,
        withBoneless,
        bonelessSauce: withBoneless ? selectedSauce : null,
        customizations: customizations,
        observations: showObservations ? observations : "",
      }

      // Si es una pizza y tiene boneless seleccionado, añadir información adicional
      if (product.tipo === "pizza" && selectedBoneless) {
        // Añadir información de boneless al producto
        const bonelessInfo = {
          ...product,
          nombre: `${product.nombre} con Boneless`,
          precio: product.tamanios[selectedVariant.name.toLowerCase()].precio + 30, // Añadir $30 por los boneless
          observaciones: observations ? `${observations} + Agregar boneless` : "Agregar boneless",
        }

        onAddToCart(bonelessInfo, { name: selectedVariant.name, precio: finalPrice })
      } else {
        onAddToCart(productInfo, { name: selectedVariant.name, precio: finalPrice })
      }

      setIsDialogOpen(false)
    }
  }

  // Obtener nombre de salsa para mostrar
  const getSauceName = (sauce) => {
    const sauces = {
      bbq: "BBQ",
      buffalo: "Buffalo",
      mango: "Mango Habanero",
      chipotle: "Chipotle",
    }
    return sauces[sauce] || sauce
  }

  return (
    <>
      <div
        className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleProductClick}
      >
        {/* Imagen del producto */}
        <div className="aspect-square bg-gray-100 relative">
          {product.imagenURL ? (
            <img
              src={product.imagenURL || "/placeholder.svg"}
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Pizza size={32} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="p-3 text-center">
          <h3 className="font-medium text-sm mb-1">{product.nombre}</h3>
          {isPizza ? (
            <p className="text-amber-600 font-bold">
              Desde {formatCurrency(110)} {/* Precio mínimo de pizza personal */}
            </p>
          ) : (
            <p className="text-amber-600 font-bold">
              {hasVariants ? `Desde ${formatCurrency(basePrice)}` : formatCurrency(product.precio || 0)}
            </p>
          )}
        </div>
      </div>

      {/* Diálogo para seleccionar variante */}
      {(hasVariants || isPizza) && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Seleccionar tamaño de {product.nombre}</DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <div className="grid gap-2">
                {isPizza ? (
                  // Mostrar tamaños de pizza con precios obtenidos del producto
                  <>
                    {product.tamanios && (
                      <>
                        {/* Definir el orden específico de los tamaños */}
                        {["personal", "chica", "mediana", "grande", "extragrande"].map((sizeName) => {
                          // Verificar si este tamaño existe en el producto y está seleccionado
                          if (product.tamanios[sizeName] && product.tamanios[sizeName].selected) {
                            const sizeData = product.tamanios[sizeName]

                            // Convertir nombres de tamaños a formato más legible
                            const displayNames = {
                              personal: "Personal",
                              chica: "Chica",
                              mediana: "Mediana",
                              grande: "Grande",
                              extragrande: "Extragrande",
                            }

                            const displayName =
                              displayNames[sizeName] || sizeName.charAt(0).toUpperCase() + sizeName.slice(1)

                            return (
                              <div
                                key={sizeName}
                                className={`border rounded-lg p-3 cursor-pointer ${
                                  selectedVariant && selectedVariant.name === displayName
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-gray-200 hover:border-amber-300"
                                }`}
                                onClick={() => setSelectedVariant({ name: displayName, price: sizeData.precio })}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{displayName}</span>
                                  <span className="font-bold">{formatCurrency(sizeData.precio)}</span>
                                </div>
                                {/* Mostrar opción de boneless si está disponible para este tamaño */}
                                {sizeData.boneless && (
                                  <div className="ml-6 flex items-center">
                                    <Checkbox
                                      id={`boneless-${sizeName}`}
                                      checked={selectedBoneless}
                                      onCheckedChange={(checked) => setSelectedBoneless(checked === true)}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`boneless-${sizeName}`} className="text-xs">
                                      Agregar boneless (+{formatCurrency(30)})
                                    </label>
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return null
                        })}
                      </>
                    )}

                    {/* Opción de boneless */}
                    {selectedVariant && (
                      <div className="mt-4 border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="boneless"
                            checked={withBoneless}
                            onCheckedChange={(checked) => setWithBoneless(checked === true)}
                          />
                          <Label htmlFor="boneless" className="font-medium">
                            Añadir boneless (+{formatCurrency(bonelessPrice)})
                          </Label>
                        </div>

                        {/* Selección de salsa */}
                        {withBoneless && (
                          <div className="ml-6 mt-2">
                            <p className="text-sm font-medium mb-2">Selecciona la salsa:</p>
                            <RadioGroup value={selectedSauce} onValueChange={setSelectedSauce}>
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="bbq" id="bbq" />
                                <Label htmlFor="bbq">BBQ</Label>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="buffalo" id="buffalo" />
                                <Label htmlFor="buffalo">Buffalo</Label>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value="mango" id="mango" />
                                <Label htmlFor="mango">Mango Habanero</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="chipotle" id="chipotle" />
                                <Label htmlFor="chipotle">Chipotle</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Opción para añadir observaciones */}
                    {selectedVariant && (
                      <div className="mt-4 border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id="showObservations"
                            checked={showObservations}
                            onCheckedChange={(checked) => setShowObservations(checked === true)}
                          />
                          <Label htmlFor="showObservations" className="font-medium">
                            Añadir observaciones
                          </Label>
                        </div>

                        {showObservations && (
                          <div className="mt-2">
                            <Textarea
                              placeholder="Ej: Sin cebolla, sin condimentos, etc."
                              value={observations}
                              onChange={(e) => setObservations(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Precio total */}
                    {selectedVariant && (
                      <div className="mt-2 text-right">
                        <p className="text-lg font-bold">
                          Total: {formatCurrency(selectedVariant.price + (withBoneless ? bonelessPrice : 0))}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  // Para otros productos con variantes
                  <>
                    {Object.entries(product.prices || {}).map(([size, price], index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 cursor-pointer ${
                          selectedVariant && selectedVariant.name === size
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-amber-300"
                        }`}
                        onClick={() => setSelectedVariant({ name: size, price })}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{size}</span>
                          <span className="font-bold">{formatCurrency(price)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Opción para añadir observaciones */}
                    {selectedVariant && (
                      <div className="mt-4 border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id="showObservations"
                            checked={showObservations}
                            onCheckedChange={(checked) => setShowObservations(checked === true)}
                          />
                          <Label htmlFor="showObservations" className="font-medium">
                            Añadir observaciones
                          </Label>
                        </div>

                        {showObservations && (
                          <div className="mt-2">
                            <Textarea
                              placeholder="Ej: Sin cebolla, sin condimentos, etc."
                              value={observations}
                              onChange={(e) => setObservations(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={!selectedVariant}
                  onClick={addSelectedVariant}
                >
                  Añadir al carrito
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
