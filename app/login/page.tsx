"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Coffee, Pizza, ChefHat, Clock, User, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"

// Esquema de validación
const formSchema = z.object({
  email: z.string().email({
    message: "Por favor ingresa un correo electrónico válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Efecto para la animación de bienvenida
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      console.log("Intentando iniciar sesión con:", values.email)
      const user = await login(values.email, values.password)
      console.log("Login exitoso, redirigiendo...")
      router.push("/")
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)

      // Información de depuración
      setDebugInfo(`Código: ${error.code || "desconocido"}, Mensaje: ${error.message || "No hay mensaje"}`)

      // Manejar diferentes tipos de errores de Firebase
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Credenciales incorrectas. Por favor intenta de nuevo.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Por favor intenta más tarde.")
      } else if (error.code === "auth/network-request-failed") {
        setError("Error de conexión. Verifica tu conexión a internet.")
      } else {
        setError(`Ocurrió un error al iniciar sesión: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Animación de bienvenida
  if (showWelcome) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center mb-4"
          >
            <motion.img
              src="/cheikys-logo.png"
              alt="Cheikys Pizza Logo"
              className="w-48 h-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-4xl font-bold text-amber-600 sr-only"
          >
            Cheikys Pizza
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-amber-700 mt-2 text-xl"
          >
            Sistema de Gestión
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Elementos decorativos flotantes
  const floatingElements = [
    {
      icon: <Pizza className="w-full h-full text-amber-500" />,
      size: "w-16 h-16",
      position: "top-[15%] left-[10%]",
      animation: "animate-float-slow",
    },
    {
      icon: <ChefHat className="w-full h-full text-amber-600" />,
      size: "w-12 h-12",
      position: "top-[25%] right-[15%]",
      animation: "animate-float-medium",
    },
    {
      icon: <Coffee className="w-full h-full text-amber-700" />,
      size: "w-10 h-10",
      position: "bottom-[20%] left-[20%]",
      animation: "animate-float-fast",
    },
    {
      icon: <Clock className="w-full h-full text-amber-400" />,
      size: "w-14 h-14",
      position: "bottom-[15%] right-[10%]",
      animation: "animate-float-slow-reverse",
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-amber-50 to-amber-100">
      {/* Elementos decorativos flotantes */}
      {floatingElements.map((element, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: index * 0.2, duration: 0.8 }}
          className={`absolute ${element.position} ${element.size} ${element.animation} opacity-70`}
        >
          {element.icon}
        </motion.div>
      ))}

      {/* Círculos decorativos */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-200 rounded-full opacity-30"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-300 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-amber-400 rounded-full opacity-10"></div>
      </div>

      {/* Patrón de pizza */}
      <div className="absolute inset-0 bg-[url('/pizza-pattern.png')] opacity-5 z-0"></div>

      {/* Formulario de login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95 border border-amber-100">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mb-4 flex justify-center"
              >
                <img src="/cheikys-logo.png" alt="Cheikys Pizza Logo" className="h-16" />
              </motion.div>
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent"
              >
                ¡Bienvenido!
              </motion.h1>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-gray-500 mt-1"
              >
                Inicia sesión para acceder al sistema
              </motion.p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-6 border-2 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {debugInfo && (
              <div className="mb-4 p-2 bg-gray-100 text-xs text-gray-700 rounded">
                <p className="font-mono">{debugInfo}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Correo electrónico</FormLabel>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500">
                            <User className="h-5 w-5" />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="correo@ejemplo.com"
                              type="email"
                              autoComplete="email"
                              disabled={isLoading}
                              className="pl-10 border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg py-2"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-gray-700 font-medium">Contraseña</FormLabel>
                          <a
                            href="#"
                            className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium"
                          >
                            ¿Olvidaste tu contraseña?
                          </a>
                        </div>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500">
                            <Lock className="h-5 w-5" />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              autoComplete="current-password"
                              disabled={isLoading}
                              className="pl-10 border-amber-200 focus:border-amber-500 focus:ring-amber-500 rounded-lg py-2"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 mt-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Iniciando sesión...
                      </div>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <div className="text-xs text-gray-500">
                Sistema desarrollado por <span className="font-medium text-amber-600">CodeSolutions</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                © {new Date().getFullYear()} Cheikys Pizza. Todos los derechos reservados.
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
