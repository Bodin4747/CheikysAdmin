"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addUser } from "@/lib/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Shield, Coffee, UserPlus } from "lucide-react"

// Modificar el esquema de validación para excluir el rol "owner"
const formSchema = z.object({
  email: z
    .string()
    .min(5, "El correo debe tener al menos 5 caracteres")
    .refine((email) => {
      // Una validación básica que verifica que haya un @ y al menos un punto después
      return email.includes("@") && email.split("@")[1].includes(".")
    }, "Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.enum(["admin", "cashier", "employee"], {
    required_error: "Debes seleccionar un rol",
  }),
})

export function AddUserDialog({ open, onOpenChange, onUserAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "employee",
    },
  })

  // Añadir el estilo para los roles (mantenemos owner para el EditUserDialog)
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
    setIsSubmitting(true)
    try {
      console.log("Añadiendo usuario:", values) // Depuración
      await addUser(values)
      toast({
        title: "Usuario añadido",
        description: "El usuario ha sido añadido correctamente",
        duration: 3000,
      })
      form.reset()
      onOpenChange(false)
      if (onUserAdded) onUserAdded()
    } catch (error) {
      console.error("Error al añadir usuario:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el usuario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Añadir nuevo usuario</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    {/* Eliminar la opción "owner" del SelectContent */}
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600">
                {isSubmitting ? "Guardando..." : "Guardar usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
