import { type NextRequest, NextResponse } from "next/server"
import { verifyIdToken } from "@/lib/firebase-admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Obtener el token del cuerpo de la solicitud
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false, message: "No se proporcionó token" }, { status: 400 })
    }

    // Verificar el token con Firebase Admin
    const decodedToken = await verifyIdToken(token)

    // Establecer una cookie de sesión segura
    cookies().set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "user",
      },
    })
  } catch (error) {
    console.error("Error al verificar token:", error)
    return NextResponse.json({ success: false, message: "Token inválido" }, { status: 401 })
  }
}
