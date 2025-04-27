"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Pizza, Coffee, Utensils } from "lucide-react"
import { getProducts } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductCard from "@/components/product-card"
import { AddProductDialog } from "@/components/add-product-dialog"

export default function ProductosPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("todos") // Filtro activo
  const [filterType, setFilterType] = useState("tipo") // Tipo de filtro: "tipo" o "categoria"
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)

  // Tipos predefinidos con iconos
  const predefinedTypes = [
    { id: "todos", name: "Todos", icon: <Utensils className="h-4 w-4" />, filterType: "tipo" },
    { id: "pizza", name: "Pizzas", icon: <Pizza className="h-4 w-4" />, highlight: true, filterType: "tipo" },
  ]

  // Categorías predefinidas
  const predefinedCategories = [
    { id: "pizzas", name: "Pizzas", icon: <Pizza className="h-4 w-4" />, filterType: "categoria" },
    { id: "bebidas", name: "Bebidas", icon: <Coffee className="h-4 w-4" />, filterType: "categoria" },
    { id: "complementos", name: "Complementos", icon: <Utensils className="h-4 w-4" />, filterType: "categoria" },
  ]

  // Estado para filtros combinados
  const [filters, setFilters] = useState([...predefinedTypes])

  useEffect(() => {
    setMounted(true)

    const loadProducts = async () => {
      try {
        if (typeof window !== "undefined") {
          console.log("Intentando cargar productos...")
          const productsData = await getProducts()
          console.log("Productos cargados:", productsData)

          // Ordenar productos: primero pizzas, luego el resto
          const sortedProducts = [...productsData].sort((a, b) => {
            if (a.tipo?.toLowerCase() === "pizza") return -1
            if (b.tipo?.toLowerCase() === "pizza") return 1
            return 0
          })

          setProducts(sortedProducts)

          // Mostrar todos los productos inicialmente
          setFilteredProducts(sortedProducts)

          // Extraer categorías únicas de los productos
          const uniqueCategories = [...new Set(productsData.map((product) => product.categoria))].filter(Boolean)
          console.log("Categorías encontradas:", uniqueCategories)

          // Combinar filtros predefinidos con categorías encontradas
          const allFilters = [...predefinedTypes]

          // Añadir categorías que no estén en los predefinidos ni dupliquen los tipos
          const addedCategories = new Set() // Para rastrear categorías ya añadidas

          uniqueCategories.forEach((category) => {
            // Evitar duplicados: si la categoría es "pizzas" y ya tenemos un filtro de tipo "pizza", saltamos
            if (category.toLowerCase() === "pizzas" && predefinedTypes.some((type) => type.id === "pizza")) {
              return // Saltar esta categoría para evitar duplicados
            }

            // Verificar si ya hemos añadido esta categoría
            if (addedCategories.has(category.toLowerCase())) {
              return // Saltar categorías duplicadas
            }

            if (!predefinedCategories.some((pc) => pc.id.toLowerCase() === category.toLowerCase())) {
              allFilters.push({
                id: category.toLowerCase(),
                name: category.charAt(0).toUpperCase() + category.slice(1),
                icon: <Utensils className="h-4 w-4" />,
                filterType: "categoria",
              })
            } else {
              // Añadir categoría predefinida
              const predefinedCategory = predefinedCategories.find(
                (pc) => pc.id.toLowerCase() === category.toLowerCase(),
              )
              if (predefinedCategory) {
                allFilters.push(predefinedCategory)
              }
            }

            // Marcar esta categoría como añadida
            addedCategories.add(category.toLowerCase())
          })

          setFilters(allFilters)
        }
      } catch (error) {
        console.error("Error al cargar productos:", error)
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      loadProducts()
    }
  }, [mounted])

  // Filtrar productos por tipo/categoría y búsqueda
  useEffect(() => {
    if (!products.length) return

    let filtered = [...products]

    // Filtrar por tipo o categoría
    if (activeFilter !== "todos") {
      if (filterType === "tipo") {
        filtered = filtered.filter((product) => product.tipo?.toLowerCase() === activeFilter.toLowerCase())
      } else if (filterType === "categoria") {
        filtered = filtered.filter((product) => product.categoria?.toLowerCase() === activeFilter.toLowerCase())
      }
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter((product) => product.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredProducts(filtered)
  }, [activeFilter, filterType, searchQuery, products])

  const handleFilterChange = (filterId, type) => {
    setActiveFilter(filterId)
    setFilterType(type)
  }

  const handleProductAdded = async () => {
    try {
      const productsData = await getProducts()

      // Ordenar productos: primero pizzas, luego el resto
      const sortedProducts = [...productsData].sort((a, b) => {
        if (a.tipo?.toLowerCase() === "pizza") return -1
        if (b.tipo?.toLowerCase() === "pizza") return 1
        return 0
      })

      setProducts(sortedProducts)

      // Mantener el filtro actual
      let filtered = [...sortedProducts]

      if (activeFilter !== "todos") {
        if (filterType === "tipo") {
          filtered = filtered.filter((product) => product.tipo?.toLowerCase() === activeFilter.toLowerCase())
        } else if (filterType === "categoria") {
          filtered = filtered.filter((product) => product.categoria?.toLowerCase() === activeFilter.toLowerCase())
        }
      }

      setFilteredProducts(filtered)

      // Actualizar categorías
      const uniqueCategories = [...new Set(productsData.map((product) => product.categoria))].filter(Boolean)

      // Combinar filtros predefinidos con categorías encontradas
      const allFilters = [...predefinedTypes]

      // Añadir categorías que no estén en los predefinidos ni dupliquen los tipos
      const addedCategories = new Set() // Para rastrear categorías ya añadidas

      uniqueCategories.forEach((category) => {
        // Evitar duplicados: si la categoría es "pizzas" y ya tenemos un filtro de tipo "pizza", saltamos
        if (category.toLowerCase() === "pizzas" && predefinedTypes.some((type) => type.id === "pizza")) {
          return // Saltar esta categoría para evitar duplicados
        }

        // Verificar si ya hemos añadido esta categoría
        if (addedCategories.has(category.toLowerCase())) {
          return // Saltar categorías duplicadas
        }

        if (!predefinedCategories.some((pc) => pc.id.toLowerCase() === category.toLowerCase())) {
          allFilters.push({
            id: category.toLowerCase(),
            name: category.charAt(0).toUpperCase() + category.slice(1),
            icon: <Utensils className="h-4 w-4" />,
            filterType: "categoria",
          })
        } else {
          // Añadir categoría predefinida
          const predefinedCategory = predefinedCategories.find((pc) => pc.id.toLowerCase() === category.toLowerCase())
          if (predefinedCategory) {
            allFilters.push(predefinedCategory)
          }
        }

        // Marcar esta categoría como añadida
        addedCategories.add(category.toLowerCase())
      })

      setFilters(allFilters)
    } catch (error) {
      console.error("Error al recargar productos:", error)
    }
  }

  if (!mounted) return null

  // Separar pizzas y otros productos para mostrarlos de manera diferente
  const pizzaProducts = filteredProducts.filter((p) => p.tipo?.toLowerCase() === "pizza")
  const otherProducts = filteredProducts.filter((p) => p.tipo?.toLowerCase() !== "pizza")

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500">Gestiona el catálogo de productos de tu negocio</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setIsAddProductOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Producto
        </Button>
      </div>

      {/* Buscador */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Buscar productos por nombre..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Botones de filtro más visuales */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id, filter.filterType)}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors ${
                activeFilter === filter.id && filterType === filter.filterType
                  ? "bg-amber-500 text-white"
                  : filter.highlight
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.icon}
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {/* Sección de pizzas destacada (si hay pizzas y no estamos filtrando por otra categoría) */}
          {pizzaProducts.length > 0 && (activeFilter === "todos" || activeFilter === "pizza") && (
            <div>
              <div className="flex items-center mb-3">
                <Pizza className="text-amber-500 mr-2" />
                <h2 className="text-lg font-bold">Pizzas</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {pizzaProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onUpdate={handleProductAdded} highlighted={true} />
                ))}
              </div>
            </div>
          )}

          {/* Otros productos */}
          {otherProducts.length > 0 &&
            (activeFilter === "todos" || activeFilter !== "pizza" || filterType === "categoria") && (
              <div className={pizzaProducts.length > 0 && activeFilter === "todos" ? "mt-6" : ""}>
                {activeFilter === "todos" && (
                  <div className="flex items-center mb-3">
                    <Utensils className="text-gray-500 mr-2" />
                    <h2 className="text-lg font-bold">Otros productos</h2>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {otherProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onUpdate={handleProductAdded} highlighted={false} />
                  ))}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No se encontraron productos</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || activeFilter !== "todos"
              ? "Intenta con otra búsqueda o categoría"
              : "Haz clic en 'Agregar Producto' para añadir tu primer producto"}
          </p>
          <Button className="mt-4 bg-amber-500 hover:bg-amber-600" onClick={() => setIsAddProductOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Producto
          </Button>
        </div>
      )}

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onProductAdded={handleProductAdded}
      />
    </div>
  )
}
