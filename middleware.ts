import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Esta función se ejecuta antes de cada solicitud
export function middleware(request: NextRequest) {
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/crear-admin"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar si hay una cookie de autenticación
  const authCookie = request.cookies.get("auth")?.value

  // Si no hay cookie de autenticación, redirigir a login
  if (!authCookie) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si hay cookie de autenticación, permitir acceso
  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
