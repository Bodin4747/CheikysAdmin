"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addProduct } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Pizza, ShoppingBag, Plus, X, Edit, Trash2 } from "lucide-react"

// Definición de la interfaz Extra
interface Extra {
  id: string
  nombre: string
  precio: number
}

const pizzaFormSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  precio: z.coerce.number().optional(), // Hacemos el precio opcional para pizzas
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  categoria: z.string().default("pizzas"),
  imagenURL: z.string().url("Ingresa una URL válida").or(z.string().length(0)),
  disponible: z.boolean().default(true),
  tipo: z.string().default("pizza"),
  tieneExtras: z.boolean().default(false),
  // Campos específicos para pizzas
  tamanios: z
    .object({
      personal: z
        .object({
          precio: z.coerce.number().min(0),
          selected: z.boolean().default(false),
          boneless: z.boolean().default(false),
        })
        .optional(),
      chica: z
        .object({
          precio: z.coerce.number().min(0),
          selected: z.boolean().default(false),
          boneless: z.boolean().default(false),
        })
        .optional(),
      mediana: z
        .object({
          precio: z.coerce.number().min(0),
          selected: z.boolean().default(false),
          boneless: z.boolean().default(false),
        })
        .optional(),
      grande: z
        .object({
          precio: z.coerce.number().min(0),
          selected: z.boolean().default(false),
          boneless: z.boolean().default(false),
        })
        .optional(),
      extragrande: z
        .object({
          precio: z.coerce.number().min(0),
          selected: z.boolean().default(false),
          boneless: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),
})

const otherProductFormSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  precio: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  categoria: z.string().min(1, "Selecciona una categoría"),
  imagenURL: z.string().url("Ingresa una URL válida").or(z.string().length(0)),
  disponible: z.boolean().default(true),
  tipo: z.string().default("otro"),
  tieneExtras: z.boolean().default(false),
})

export function AddProductDialog({ open, onOpenChange, onProductAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("pizza")
  const [otherExtras, setOtherExtras] = useState<Extra[]>([])
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [currentExtra, setCurrentExtra] = useState<Extra | null>(null)
  const [extraNombre, setExtraNombre] = useState("")
  const [extraPrecio, setExtraPrecio] = useState("")
  const { toast } = useToast()
  const [pizzaExtras, setPizzaExtras] = useState<Extra[]>([])

  const pizzaForm = useForm({
    resolver: zodResolver(pizzaFormSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      descripcion: "",
      categoria: "pizzas",
      imagenURL: "",
      disponible: true,
      tipo: "pizza",
      tieneExtras: false,
      tamanios: {
        personal: { precio: 0, selected: false, boneless: false },
        chica: { precio: 0, selected: false, boneless: false },
        mediana: { precio: 0, selected: false, boneless: false },
        grande: { precio: 0, selected: false, boneless: false },
        extragrande: { precio: 0, selected: false, boneless: false },
      },
    },
  })

  const otherProductForm = useForm({
    resolver: zodResolver(otherProductFormSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      descripcion: "",
      categoria: "",
      imagenURL: "",
      disponible: true,
      tipo: "otro",
      tieneExtras: false,
    },
  })

  // Resetear formularios al cerrar el diálogo
  useEffect(() => {
    if (!open) {
      pizzaForm.reset()
      otherProductForm.reset()
      setOtherExtras([])
      setPizzaExtras([])
      setShowExtraForm(false)
      setCurrentExtra(null)
      setExtraNombre("")
      setExtraPrecio("")
    }
  }, [open, pizzaForm, otherProductForm])

  // Función para generar un ID único
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  const handleAddExtra = () => {
    if (
      !extraNombre.trim() ||
      !extraPrecio.trim() ||
      isNaN(Number.parseFloat(extraPrecio)) ||
      Number.parseFloat(extraPrecio) <= 0
    ) {
      toast({
        title: "Error",
        description: "Ingresa un nombre y un precio válido para el extra",
        variant: "destructive",
      })
      return
    }

    const extras = activeTab === "pizza" ? pizzaExtras : otherExtras
    const setExtras = activeTab === "pizza" ? setPizzaExtras : setOtherExtras

    if (currentExtra) {
      // Editar extra existente
      setExtras(
        extras.map((extra) =>
          extra.id === currentExtra.id
            ? { ...extra, nombre: extraNombre, precio: Number.parseFloat(extraPrecio) }
            : extra,
        ),
      )
      toast({
        title: "Extra actualizado",
        description: `El extra "${extraNombre}" ha sido actualizado`,
        duration: 2000,
      })
    } else {
      // Añadir nuevo extra
      const newExtra: Extra = {
        id: generateId(),
        nombre: extraNombre,
        precio: Number.parseFloat(extraPrecio),
      }
      setExtras([...extras, newExtra])
      toast({
        title: "Extra añadido",
        description: `El extra "${extraNombre}" ha sido añadido`,
        duration: 2000,
      })
    }

    // Limpiar formulario
    setExtraNombre("")
    setExtraPrecio("")
    setCurrentExtra(null)
    setShowExtraForm(false)
  }

  const handleEditExtra = (extra: Extra) => {
    setCurrentExtra(extra)
    setExtraNombre(extra.nombre)
    setExtraPrecio(extra.precio.toString())
    setShowExtraForm(true)
  }

  const handleDeleteExtra = (id: string) => {
    if (activeTab === "pizza") {
      setPizzaExtras(pizzaExtras.filter((extra) => extra.id !== id))
    } else {
      setOtherExtras(otherExtras.filter((extra) => extra.id !== id))
    }

    toast({
      title: "Extra eliminado",
      description: "El extra ha sido eliminado",
      duration: 2000,
    })
  }

  const onSubmitPizza = async (values) => {
    try {
      setIsSubmitting(true)
      console.log("Iniciando envío del formulario de pizza")
      console.log("Valores del formulario:", values)

      // Verificar si al menos un tamaño está seleccionado
      let alMenosUnTamanioSeleccionado = false
      const tamanios = {}

      if (values.tamanios) {
        Object.entries(values.tamanios).forEach(([size, data]) => {
          if (data.selected && data.precio > 0) {
            alMenosUnTamanioSeleccionado = true
            tamanios[size] = {
              precio: Number(data.precio),
              selected: true,
              boneless: data.boneless || false,
            }
          }
        })
      }

      if (!alMenosUnTamanioSeleccionado) {
        toast({
          title: "Error",
          description: "Debes seleccionar al menos un tamaño de pizza y asignarle un precio",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Crear objeto de producto
      const productData = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        categoria: "pizzas",
        imagenURL: values.imagenURL || "",
        disponible: values.disponible,
        tipo: "pizza",
        tieneExtras: false, // Forzar a false para pizzas
        tamanios: tamanios,
      }

      console.log("Datos a enviar a Firestore:", productData)

      const productId = await addProduct(productData)
      console.log("Pizza guardada con ID:", productId)

      toast({
        title: "Pizza añadida",
        description: "La pizza ha sido añadida correctamente",
        duration: 3000,
      })

      pizzaForm.reset()
      setPizzaExtras([])
      onOpenChange(false)
      if (onProductAdded) onProductAdded()
    } catch (error) {
      console.error("Error al añadir pizza:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir la pizza: " + (error.message || "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitOtherProduct = async (values) => {
    setIsSubmitting(true)
    try {
      console.log("Procesando formulario de otro producto con valores:", values)
      console.log("Extras actuales:", otherExtras)

      // Crear objeto de producto
      const productData = {
        ...values,
      }

      // Añadir extras si están activados
      if (values.tieneExtras) {
        // Verificar que hay extras para guardar
        if (otherExtras && otherExtras.length > 0) {
          // Asignar directamente el array de extras
          productData.extrasData = otherExtras.map((extra) => ({
            id: extra.id,
            nombre: extra.nombre,
            precio: extra.precio,
          }))
          console.log("Guardando extras:", productData.extrasData)
        } else {
          // Si no hay extras pero tieneExtras es true, guardar un array vacío
          productData.extrasData = []
          console.log("No hay extras para guardar, pero tieneExtras es true")
        }
      }

      console.log("Datos a enviar a Firestore:", productData)

      const productId = await addProduct(productData)
      console.log("Producto guardado con ID:", productId)

      toast({
        title: "Producto añadido",
        description: "El producto ha sido añadido correctamente",
        duration: 3000,
      })
      otherProductForm.reset()
      setOtherExtras([])
      onOpenChange(false)
      if (onProductAdded) onProductAdded()
    } catch (error) {
      console.error("Error al añadir producto:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el producto: " + (error.message || "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Obtener los extras actuales para mostrar en la interfaz
  const extrasToShow = activeTab === "pizza" ? pizzaExtras : otherExtras

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir nuevo producto</DialogTitle>
        </DialogHeader>

        {/* Indicador de tipo de producto seleccionado */}
        <div
          className={`p-2 mb-4 rounded-lg text-white font-medium flex items-center justify-center ${
            activeTab === "pizza" ? "bg-amber-500" : "bg-blue-500"
          }`}
        >
          {activeTab === "pizza" ? (
            <>
              <Pizza className="mr-2 h-5 w-5" /> Creando una nueva pizza
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-5 w-5" /> Creando un nuevo producto
            </>
          )}
        </div>

        <Tabs defaultValue="pizza" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger
              value="pizza"
              className={`flex items-center gap-2 ${activeTab === "pizza" ? "bg-amber-500 text-white" : ""}`}
            >
              <Pizza className="h-4 w-4" /> Pizza
            </TabsTrigger>
            <TabsTrigger value="otro" className={activeTab === "otro" ? "bg-blue-500 text-white" : ""}>
              Otro producto
            </TabsTrigger>
          </TabsList>

          {/* Formulario para pizzas */}
          <TabsContent value="pizza">
            <Form {...pizzaForm}>
              <form onSubmit={pizzaForm.handleSubmit(onSubmitPizza)} className="space-y-4 overflow-visible">
                <FormField
                  control={pizzaForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la pizza</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pizza Hawaiana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pizzaForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción de la pizza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={pizzaForm.control}
                  name="imagenURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de imagen</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Precios por tamaño con checkboxes */}
                <div className="bg-amber-50 p-3 rounded-md">
                  <h3 className="text-sm font-medium mb-3">Tamaños disponibles</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Tamaño Personal */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FormField
                          control={pizzaForm.control}
                          name="tamanios.personal.selected"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="personal" />
                              </FormControl>
                              <FormLabel htmlFor="personal" className="cursor-pointer m-0 font-normal">
                                Personal
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      {pizzaForm.watch("tamanios.personal.selected") && (
                        <div className="space-y-2">
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.personal.precio"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="Precio" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.personal.boneless"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 m-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="personal-boneless"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="personal-boneless"
                                  className="cursor-pointer m-0 font-normal text-xs"
                                >
                                  Opción con boneless
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tamaño Chica */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FormField
                          control={pizzaForm.control}
                          name="tamanios.chica.selected"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="chica" />
                              </FormControl>
                              <FormLabel htmlFor="chica" className="cursor-pointer m-0 font-normal">
                                Chica
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      {pizzaForm.watch("tamanios.chica.selected") && (
                        <div className="space-y-2">
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.chica.precio"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="Precio" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.chica.boneless"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 m-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="chica-boneless"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="chica-boneless" className="cursor-pointer m-0 font-normal text-xs">
                                  Opción con boneless
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tamaño Mediana */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FormField
                          control={pizzaForm.control}
                          name="tamanios.mediana.selected"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="mediana" />
                              </FormControl>
                              <FormLabel htmlFor="mediana" className="cursor-pointer m-0 font-normal">
                                Mediana
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      {pizzaForm.watch("tamanios.mediana.selected") && (
                        <div className="space-y-2">
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.mediana.precio"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="Precio" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.mediana.boneless"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 m-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="mediana-boneless"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="mediana-boneless"
                                  className="cursor-pointer m-0 font-normal text-xs"
                                >
                                  Opción con boneless
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tamaño Grande */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FormField
                          control={pizzaForm.control}
                          name="tamanios.grande.selected"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="grande" />
                              </FormControl>
                              <FormLabel htmlFor="grande" className="cursor-pointer m-0 font-normal">
                                Grande
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      {pizzaForm.watch("tamanios.grande.selected") && (
                        <div className="space-y-2">
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.grande.precio"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="Precio" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.grande.boneless"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 m-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="grande-boneless"
                                  />
                                </FormControl>
                                <FormLabel htmlFor="grande-boneless" className="cursor-pointer m-0 font-normal text-xs">
                                  Opción con boneless
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tamaño Extra Grande */}
                    <div className="col-span-2">
                      <div className="flex items-center mb-2">
                        <FormField
                          control={pizzaForm.control}
                          name="tamanios.extragrande.selected"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="extragrande" />
                              </FormControl>
                              <FormLabel htmlFor="extragrande" className="cursor-pointer m-0 font-normal">
                                Extragrande
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      {pizzaForm.watch("tamanios.extragrande.selected") && (
                        <div className="space-y-2">
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.extragrande.precio"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" placeholder="Precio" {...field} className="h-8 text-sm" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={pizzaForm.control}
                            name="tamanios.extragrande.boneless"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 m-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="extragrande-boneless"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor="extragrande-boneless"
                                  className="cursor-pointer m-0 font-normal text-xs"
                                >
                                  Opción con boneless
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={pizzaForm.control}
                    name="disponible"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="disponible" />
                        </FormControl>
                        <FormLabel htmlFor="disponible" className="cursor-pointer font-normal">
                          Disponible
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600">
                    {isSubmitting ? "Guardando..." : "Guardar pizza"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Formulario para otros productos */}
          <TabsContent value="otro">
            <Form {...otherProductForm}>
              <form
                onSubmit={otherProductForm.handleSubmit(onSubmitOtherProduct)}
                className="space-y-4 overflow-visible"
              >
                <FormField
                  control={otherProductForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otherProductForm.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={otherProductForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción del producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={otherProductForm.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bebidas">Bebidas</SelectItem>
                            <SelectItem value="complementos">Complementos</SelectItem>
                            <SelectItem value="desayunos">Desayunos</SelectItem>
                            <SelectItem value="boneless">Boneless</SelectItem>
                            <SelectItem value="alitas">Alitas</SelectItem>
                            <SelectItem value="hamburguesas">Hamburguesas</SelectItem>
                            <SelectItem value="sushi">Sushi</SelectItem>
                            <SelectItem value="pancakes">Pancakes/Waffles</SelectItem>
                            <SelectItem value="postres">Postres</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={otherProductForm.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Input value="Otro producto" disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={otherProductForm.control}
                  name="imagenURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de imagen</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={otherProductForm.control}
                    name="disponible"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} id="disponible-otro" />
                        </FormControl>
                        <FormLabel htmlFor="disponible-otro" className="cursor-pointer font-normal">
                          Disponible
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="col-span-2 bg-amber-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Extras/Complementos</h3>
                      <FormField
                        control={otherProductForm.control}
                        name="tieneExtras"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <div className="flex items-center">
                              <span className="text-xs mr-2">Activar extras</span>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Agrega opciones adicionales que modifican el precio base del producto.
                    </p>

                    {otherProductForm.watch("tieneExtras") && (
                      <div className="border rounded-md p-3 bg-white">
                        {/* Lista de extras */}
                        {otherExtras.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {otherExtras.map((extra) => (
                              <div
                                key={extra.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                              >
                                <div>
                                  <p className="font-medium">{extra.nombre}</p>
                                  <p className="text-xs text-gray-500">${extra.precio.toFixed(2)}</p>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditExtra(extra)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500"
                                    onClick={() => handleDeleteExtra(extra.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-3">No hay extras configurados</div>
                        )}

                        {/* Formulario para añadir/editar extras */}
                        {showExtraForm ? (
                          <div className="border-t pt-3 mt-3">
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium">Nombre del extra</label>
                                <Input
                                  value={extraNombre}
                                  onChange={(e) => setExtraNombre(e.target.value)}
                                  placeholder="Ej: Queso extra"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Precio adicional</label>
                                <Input
                                  type="number"
                                  value={extraPrecio}
                                  onChange={(e) => setExtraPrecio(e.target.value)}
                                  placeholder="0.00"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button type="button" size="sm" className="flex-1 h-8" onClick={handleAddExtra}>
                                  {currentExtra ? "Actualizar" : "Añadir"}
                                </Button>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => {
                                    setShowExtraForm(false)
                                    setCurrentExtra(null)
                                    setExtraNombre("")
                                    setExtraPrecio("")
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full mt-2 text-sm"
                            onClick={() => setShowExtraForm(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Agregar extra
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600">
                    {isSubmitting ? "Guardando..." : "Guardar producto"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
