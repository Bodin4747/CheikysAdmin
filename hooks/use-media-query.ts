"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Evitar errores durante SSR
    if (typeof window === "undefined") return

    const media = window.matchMedia(query)

    // Actualizar el estado inicial
    setMatches(media.matches)

    // Definir el callback para cambios
    const listener = () => setMatches(media.matches)

    // Usar addEventListener para compatibilidad moderna
    media.addEventListener("change", listener)

    // Limpiar
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}
