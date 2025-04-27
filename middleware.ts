import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Este middleware se ejecuta antes de cargar cualquier página
export function middleware(request: NextRequest) {
  // Obtener la cookie de autenticación (puedes ajustar el nombre según tu implementación)
  const authCookie = request.cookies.get("auth")
  const isLoggedIn = !!authCookie?.value

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/crear-admin"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Si no está autenticado y no es una ruta pública, redirigir al login
  if (!isLoggedIn && !isPublicRoute) {
    // Guardar la URL actual para redirigir después del login
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Si está autenticado e intenta acceder al login, redirigir al dashboard
  if (isLoggedIn && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
