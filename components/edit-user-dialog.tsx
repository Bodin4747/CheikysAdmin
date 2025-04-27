"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateUser } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Coffee, UserPlus } from "lucide-react"

// Esquema de validación para la edición de usuarios
const formSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(["admin", "cashier", "employee", "owner"], {
    required_error: "Debes seleccionar un rol",
  }),
})

export function EditUserDialog({ open, onOpenChange, user, onUserUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      role: "employee",
    },
  })

  // Actualizar el formulario cuando cambia el usuario seleccionado
  useEffect(() => {
    if (user) {
      console.log("Cargando datos de usuario para editar:", user) // Depuración
      form.reset({
        displayName: user.displayName || "",
        role: user.role || "employee",
      })
    }
  }, [user, form])

  // Estilos para los roles
  const roleStyles = {
    admin: {
      icon: <Shield className="mr-2 h-4 w-4 text-blue-500" />,
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
    },
    cashier: {
      icon: <Coffee className="mr-2 h-4 w-4 text-green-500" />,
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
    },
    employee: {
      icon: <UserPlus className="mr-2 h-4 w-4 text-amber-500" />,
      bg: "bg-amber-100",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    owner: {
      icon: <Shield className="mr-2 h-4 w-4 text-purple-500" />,
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-200",
    },
  }

  const onSubmit = async (values) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "No se puede actualizar el usuario porque no es válido",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Actualizando usuario:", user.id, values) // Depuración
      await updateUser(user.id, values)
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente",
        duration: 3000,
      })
      onOpenChange(false)
      if (onUserUpdated) onUserUpdated()
    } catch (error) {
      console.error("Error al actualizar usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si no hay usuario seleccionado, no mostrar el diálogo
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {user.role === "owner" && (
                <p className="mt-2 text-amber-600">
                  <strong>Nota:</strong> El rol de propietario no puede ser modificado.
                </p>
              )}
            </div>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={user.role === "owner"} // Deshabilitar si es propietario
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin" className="flex items-center">
                        <div className={`flex items-center ${roleStyles.admin.text}`}>
                          {roleStyles.admin.icon} Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="cashier" className="flex items-center">
                        <div className={`flex items-center ${roleStyles.cashier.text}`}>
                          {roleStyles.cashier.icon} Cajero
                        </div>
                      </SelectItem>
                      <SelectItem value="employee" className="flex items-center">
                        <div className={`flex items-center ${roleStyles.employee.text}`}>
                          {roleStyles.employee.icon} Empleado
                        </div>
                      </SelectItem>
                      {/* Solo mostrar la opción de propietario si el usuario ya es propietario */}
                      {user.role === "owner" && (
                        <SelectItem value="owner" className="flex items-center">
                          <div className={`flex items-center ${roleStyles.owner.text}`}>
                            {roleStyles.owner.icon} Propietario
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600">
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
