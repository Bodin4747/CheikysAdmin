"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Pizza,
  ShoppingCart,
  ClipboardList,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  // Detectar si estamos en una pantalla de tablet o móvil
  const isTablet = useMediaQuery("(max-width: 1024px)")

  // Colapsar automáticamente en tablets
  useEffect(() => {
    if (isTablet) {
      setCollapsed(true)
    }
  }, [isTablet])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar sidebar en móvil cuando se cambia de ruta
  useEffect(() => {
    if (isTablet) {
      setMobileOpen(false)
    }
  }, [pathname, isTablet])

  // Definir todos los elementos del menú sin restricciones de roles
  const menuItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <Home size={20} />,
    },
    {
      name: "Punto de Venta",
      href: "/punto-de-venta",
      icon: <ShoppingCart size={20} />,
    },
    {
      name: "Pedidos",
      href: "/pedidos",
      icon: <ClipboardList size={20} />,
      badge: 1, // Número de notificaciones
    },
    {
      name: "Productos",
      href: "/productos",
      icon: <Pizza size={20} />,
    },
    {
      name: "Reportes",
      href: "/reportes",
      icon: <BarChart2 size={20} />,
    },
    {
      name: "Usuarios",
      href: "/usuarios",
      icon: <Users size={20} />,
    },
    {
      name: "Configuración",
      href: "/configuracion",
      icon: <Settings size={20} />,
    },
  ]

  if (!mounted) return null

  // Determinar si mostrar el sidebar basado en el estado móvil
  const showSidebar = !isTablet || mobileOpen

  return (
    <>
      {/* Botón de menú móvil */}
      {isTablet && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 bg-amber-500 text-white p-2 rounded-md shadow-md"
          aria-label="Menú"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay para cerrar el menú en móvil */}
      {isTablet && mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "h-full bg-white border-r transition-all duration-300 z-40",
          isTablet ? "fixed" : "relative",
          collapsed ? "w-16" : "w-64",
          showSidebar ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo y título */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 rounded-full p-1">
              <img src="/cheikys-logo.png" alt="Cheikys Pizza" className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-amber-500">Cheikys Pizza</h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:bg-gray-100 rounded-full p-1"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md transition-colors",
                    pathname === item.href ? "bg-amber-500 text-white" : "text-gray-600 hover:bg-gray-100",
                  )}
                  title={collapsed ? item.name : undefined}
                  onClick={() => isTablet && setMobileOpen(false)}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Perfil de usuario */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-800 font-bold rounded-md w-8 h-8 flex items-center justify-center flex-shrink-0">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName || user?.email || "Usuario"}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
