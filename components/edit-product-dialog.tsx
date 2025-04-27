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
import { Checkbox } from "@/components/ui/checkbox"
import { updateProduct } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Pizza, ShoppingBag } from "lucide-react"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  precio: z.coerce.number().optional(), // Hacemos el precio opcional para pizzas
  descripcion: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  categoria: z.string().min(1, "Selecciona una categoría"),
  imagenURL: z.string().url("Ingresa una URL válida").or(z.string().length(0)),
  disponible: z.boolean().default(true),
  tipo: z.string().min(1, "Selecciona un tipo"),
  tipoSalsa: z.string().optional(),
  numeroRollos: z.coerce.number().optional(),
  tieneExtras: z.boolean().default(false),
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

export function EditProductDialog({ open, onOpenChange, product, onProductUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      precio: 0,
      descripcion: "",
      categoria: "",
      imagenURL: "",
      disponible: true,
      tipo: "otro",
      tipoSalsa: "",
      numeroRollos: 0,
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

  useEffect(() => {
    if (product && open) {
      console.log("Cargando producto para editar:", product)

      try {
        // Preparar los tamaños para el formulario
        const tamanios = {
          personal: { precio: 0, selected: false, boneless: false },
          chica: { precio: 0, selected: false, boneless: false },
          mediana: { precio: 0, selected: false, boneless: false },
          grande: { precio: 0, selected: false, boneless: false },
          extragrande: { precio: 0, selected: false, boneless: false },
        }

        // Si el producto tiene tamaños, actualizar los valores
        if (product.tamanios) {
          Object.entries(product.tamanios).forEach(([size, data]) => {
            if (tamanios[size]) {
              tamanios[size] = {
                precio: data.precio || 0,
                selected: true,
                boneless: data.boneless || false,
              }
            }
          })
        }

        form.reset({
          nombre: product.nombre || "",
          precio: product.precio || 0,
          descripcion: product.descripcion || "",
          categoria: product.categoria || "",
          imagenURL: product.imagenURL || "",
          disponible: product.disponible ?? true,
          tipo: product.tipo || "otro",
          tipoSalsa: product.tipoSalsa || "",
          numeroRollos: product.numeroRollos || 0,
          tieneExtras: product.tieneExtras ?? false,
          tamanios: tamanios,
        })
      } catch (error) {
        console.error("Error al cargar datos del producto:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del producto",
          variant: "destructive",
        })
      }
    }
  }, [product, open, form, toast])

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!open) {
    }
  }, [open])

  const onSubmit = async (values) => {
    if (!product?.id) return

    try {
      setIsSubmitting(true)
      console.log("Procesando formulario de edición con valores:", values)

      // Crear objeto de producto actualizado
      const productData: any = {
        nombre: values.nombre,
        descripcion: values.descripcion,
        categoria: values.categoria,
        imagenURL: values.imagenURL || "",
        disponible: values.disponible,
        tipo: values.tipo,
      }

      // Si es una pizza, procesar tamaños y forzar tieneExtras a false
      if (values.tipo === "pizza") {
        // Filtrar tamaños con precio > 0 y selected = true
        const tamanios = {}
        let alMenosUnTamanioSeleccionado = false

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

        productData.tamanios = tamanios
        // Eliminar precio si es una pizza
        delete productData.precio
        // Forzar tieneExtras a false para pizzas
        productData.tieneExtras = false
        productData.extrasData = null
      } else {
        // Si no es pizza, usar el precio normal y mantener tieneExtras según el valor del formulario
        productData.precio = values.precio
        // Eliminar tamaños si existen
        productData.tamanios = null
        // Mantener el valor de tieneExtras del formulario
        productData.tieneExtras = values.tieneExtras

        // Si tiene extras activados, mantener los datos de extras existentes
        if (values.tieneExtras && product.extrasData) {
          productData.extrasData = product.extrasData
        }
      }

      console.log("Datos a enviar a Firestore:", productData)

      await updateProduct(product.id, productData)
      console.log("Producto actualizado correctamente")

      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado correctamente",
        duration: 3000,
      })
      onOpenChange(false)
      if (onProductUpdated) onProductUpdated()
    } catch (error) {
      console.error("Error al actualizar producto:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto: " + (error.message || "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPizza = form.watch("tipo") === "pizza"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>

        {/* Indicador de tipo de producto */}
        <div
          className={`p-2 mb-4 rounded-lg text-white font-medium flex items-center justify-center ${
            isPizza ? "bg-amber-500" : "bg-blue-500"
          }`}
        >
          {isPizza ? (
            <>
              <Pizza className="mr-2 h-5 w-5" /> Editando una pizza
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-5 w-5" /> Editando un producto
            </>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-visible">
            <FormField
              control={form.control}
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

            {!isPizza && (
              <FormField
                control={form.control}
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
            )}

            <FormField
              control={form.control}
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
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pizzas">Pizzas</SelectItem>
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
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pizza">Pizza</SelectItem>
                        <SelectItem value="otro">Otro producto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
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

            {/* Mostrar tamaños solo si es una pizza */}
            {isPizza && (
              <div className="bg-amber-50 p-3 rounded-md">
                <h3 className="text-sm font-medium mb-3">Tamaños disponibles</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Tamaño Personal */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FormField
                        control={form.control}
                        name="tamanios.personal.selected"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-personal" />
                            </FormControl>
                            <FormLabel htmlFor="edit-personal" className="cursor-pointer m-0 font-normal">
                              Personal
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("tamanios.personal.selected") && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="tamanios.personal.boneless"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="edit-personal-boneless"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-personal-boneless"
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
                        control={form.control}
                        name="tamanios.chica.selected"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-chica" />
                            </FormControl>
                            <FormLabel htmlFor="edit-chica" className="cursor-pointer m-0 font-normal">
                              Chica
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("tamanios.chica.selected") && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="tamanios.chica.boneless"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="edit-chica-boneless"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-chica-boneless"
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

                  {/* Tamaño Mediana */}
                  <div>
                    <div className="flex items-center mb-2">
                      <FormField
                        control={form.control}
                        name="tamanios.mediana.selected"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-mediana" />
                            </FormControl>
                            <FormLabel htmlFor="edit-mediana" className="cursor-pointer m-0 font-normal">
                              Mediana
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("tamanios.mediana.selected") && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="tamanios.mediana.boneless"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="edit-mediana-boneless"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-mediana-boneless"
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
                        control={form.control}
                        name="tamanios.grande.selected"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-grande" />
                            </FormControl>
                            <FormLabel htmlFor="edit-grande" className="cursor-pointer m-0 font-normal">
                              Grande
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("tamanios.grande.selected") && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="tamanios.grande.boneless"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="edit-grande-boneless"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-grande-boneless"
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

                  {/* Tamaño Extra Grande */}
                  <div className="col-span-2">
                    <div className="flex items-center mb-2">
                      <FormField
                        control={form.control}
                        name="tamanios.extragrande.selected"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 m-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-extragrande" />
                            </FormControl>
                            <FormLabel htmlFor="edit-extragrande" className="cursor-pointer m-0 font-normal">
                              Extragrande
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch("tamanios.extragrande.selected") && (
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
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
                          control={form.control}
                          name="tamanios.extragrande.boneless"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 m-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="edit-extragrande-boneless"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-extragrande-boneless"
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
            )}

            {!isPizza && (
              <div className="col-span-2 bg-amber-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Extras/Complementos</h3>
                  <FormField
                    control={form.control}
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
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disponible"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} id="edit-disponible" />
                    </FormControl>
                    <FormLabel htmlFor="edit-disponible" className="cursor-pointer font-normal">
                      Disponible
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={isPizza ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
