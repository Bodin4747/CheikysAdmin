"use client"

import { useState } from "react"
import { Edit, Trash2, MoreVertical, Pizza, Check, X, Tag, Coffee, Utensils } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditProductDialog } from "@/components/edit-product-dialog"
import { deleteProduct } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Función para obtener el precio mínimo de los tamaños
const getMinPrice = (product) => {
  // Si tiene tamaños, buscar el precio mínimo
  if (product.tamanios) {
    const prices = Object.entries(product.tamanios)
      .filter(([_, value]) => value.precio)
      .map(([_, value]) => value.precio)

    return prices.length > 0 ? Math.min(...prices) : product.precio || 0
  }

  // Si no tiene tamaños, usar el precio base
  return product.precio || 0
}

// Función para obtener el precio máximo de los tamaños
const getMaxPrice = (product) => {
  // Si tiene tamaños, buscar el precio máximo
  if (product.tamanios) {
    const prices = Object.entries(product.tamanios)
      .filter(([_, value]) => value.precio)
      .map(([_, value]) => value.precio)

    return prices.length > 0 ? Math.max(...prices) : product.precio || 0
  }

  // Si no tiene tamaños, usar el precio base
  return product.precio || 0
}

export default function ProductCard({ product, onUpdate, highlighted = false }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()

  // Determinar el icono según el tipo
  const getTypeIcon = () => {
    const type = product.tipo?.toLowerCase()
    if (type === "pizza") return <Pizza className="h-4 w-4" />
    if (type === "bebida") return <Coffee className="h-4 w-4" />
    return <Utensils className="h-4 w-4" />
  }

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await deleteProduct(product.id)
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado correctamente",
          duration: 3000,
        })
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error("Error al eliminar producto:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive",
        })
      }
    }
  }

  // Determinar si es una pizza para aplicar estilos especiales
  const isPizza = product.tipo?.toLowerCase() === "pizza"

  // Obtener precios mínimo y máximo
  const minPrice = getMinPrice(product)
  const maxPrice = getMaxPrice(product)
  const hasSizes = product.tamanios && Object.keys(product.tamanios).length > 0

  // Determinar si mostrar rango de precios
  const showPriceRange = hasSizes && minPrice !== maxPrice

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${highlighted ? "ring-1 ring-amber-300" : ""}`}>
      {/* Ribbon para pizzas destacadas */}
      {isPizza && highlighted && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 transform rotate-45 translate-x-5 -translate-y-1">
            PIZZA
          </div>
        </div>
      )}

      <div className={`relative ${highlighted ? "h-40" : "h-36"} w-full overflow-hidden`}>
        {product.imagenURL && !imageError ? (
          <img
            src={product.imagenURL || "/placeholder.svg"}
            alt={product.nombre}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              console.log("Error al cargar imagen:", product.nombre, product.imagenURL)
              setImageError(true)
            }}
          />
        ) : (
          <div className={`h-full w-full ${isPizza ? "bg-amber-50" : "bg-gray-50"} flex items-center justify-center`}>
            {isPizza ? (
              <Pizza size={36} className="text-amber-400" />
            ) : (
              <div className="text-3xl text-gray-300">{product.nombre.charAt(0)}</div>
            )}
          </div>
        )}

        {/* Indicador de disponibilidad más visual */}
        <div className="absolute top-2 left-2">
          <Badge
            className={`${
              product.disponible
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            } 
              flex items-center gap-1 px-1.5 py-0.5 text-xs`}
          >
            {product.disponible ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {product.disponible ? "Disponible" : "No disponible"}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-white/80 rounded-full h-7 w-7 hover:bg-white">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className={`p-3 ${isPizza && highlighted ? "bg-amber-50" : ""}`}>
        <div className="flex justify-between items-start mb-1">
          <h3 className={`font-bold ${highlighted ? "text-base" : "text-sm"} line-clamp-1`}>{product.nombre}</h3>
        </div>

        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.descripcion}</p>

        {/* Precio más destacado */}
        <div className="mb-2 bg-amber-100 text-amber-800 px-2 py-1 rounded-md flex items-center justify-between">
          <span className="text-xs font-medium">Precio:</span>
          <span className="font-bold text-sm">
            {showPriceRange ? `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}` : formatCurrency(minPrice)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-xs py-0">
            {getTypeIcon()}
            {product.tipo || "Sin tipo"}
          </Badge>

          {product.categoria && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-0">
              <Tag className="h-3 w-3 mr-1" />
              {product.categoria}
            </Badge>
          )}

          {/* Mostrar badge de extras solo si no es pizza y tiene extras */}
          {product.tieneExtras && product.tipo?.toLowerCase() !== "pizza" && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs py-0">Con extras</Badge>
          )}
        </div>
      </CardContent>

      <EditProductDialog open={isEditOpen} onOpenChange={setIsEditOpen} product={product} onProductUpdated={onUpdate} />
    </Card>
  )
}
