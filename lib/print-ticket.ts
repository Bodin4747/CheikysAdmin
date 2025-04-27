// lib/print-ticket.ts
import { getPrinterConfig } from "./config"

export interface TicketItem {
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
  variante?: string
  observaciones?: string
  withBoneless?: boolean // Añadimos esta propiedad
  bonelessSauce?: string // Añadimos esta propiedad
}

export interface TicketData {
  items: TicketItem[]
  subtotal: number
  iva?: number
  total: number
  clientName?: string
  phoneNumber?: string
  cajero?: string
  fecha?: Date
  metodoPago: string
  cambio?: number
  montoRecibido?: number
  folio?: string
  tipoVenta?: string
}

export async function printTicket(ticketData: TicketData): Promise<boolean> {
  try {
    // Obtener la configuración de la impresora desde Firestore
    const config = await getPrinterConfig()

    // Crear el contenido del ticket
    const ticketContent = await generateTicketHTML(ticketData, config)

    // Crear un iframe oculto para imprimir
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)

    // Escribir el contenido en el iframe
    iframe.contentDocument.write(ticketContent)
    iframe.contentDocument.close()

    // Esperar a que se cargue el contenido
    iframe.onload = () => {
      try {
        // Imprimir el iframe
        iframe.contentWindow.print()

        // Eliminar el iframe después de un tiempo
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 2000)
      } catch (error) {
        console.error("Error al imprimir:", error)
        document.body.removeChild(iframe)
      }
    }

    return true
  } catch (error) {
    console.error("Error al imprimir ticket:", error)
    return false
  }
}

// Función para generar el HTML del ticket
async function generateTicketHTML(ticketData: TicketData, config: any): Promise<string> {
  const { textoEncabezado, textoPie, mostrarLogo, imprimirCajero, imprimirFecha, anchoTicket } = config

  const width = anchoTicket || 58 // Ancho en mm (estándar para tickets)

  // Formatear fecha
  const fecha = ticketData.fecha ? new Date(ticketData.fecha) : new Date()
  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(fecha)

  // Crear el contenido HTML del ticket
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket de Venta</title>
      <style>
        @page {
          margin: 0;
          size: ${width}mm auto;
        }
        body {
          font-family: 'Courier New', monospace;
          width: ${width}mm;
          margin: 0;
          padding: 5mm;
          font-size: 10px;
        }
        .ticket {
          width: 100%;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .logo {
          text-align: center;
          margin-bottom: 5px;
        }
        .logo img {
          max-width: 100%;
          height: auto;
        }
        .items {
          width: 100%;
        }
        .item {
          margin-bottom: 3px;
        }
        .item-name {
          font-weight: bold;
        }
        .item-detail {
          font-style: italic;
          font-size: 9px;
        }
        .totals {
          margin-top: 10px;
          text-align: right;
          border-top: 1px dashed black;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 9px;
          border-top: 1px dashed black;
          padding-top: 5px;
        }
        .center {
          text-align: center;
        }
        .bold {
          font-weight: bold;
        }
        .divider {
          border-bottom: 1px dashed black;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          ${mostrarLogo ? '<div class="logo">LOGO</div>' : ""}
          ${
            textoEncabezado
              ? textoEncabezado
                  .split("\n")
                  .map((line) => `<div>${line}</div>`)
                  .join("")
              : ""
          }
        </div>
        
        <div class="center">
          ${imprimirFecha ? `<div>Fecha: ${fechaFormateada}</div>` : ""}
          ${ticketData.folio ? `<div>Folio: ${ticketData.folio}</div>` : ""}
          ${ticketData.clientName ? `<div>Cliente: ${ticketData.clientName}</div>` : ""}
          ${ticketData.phoneNumber ? `<div>Teléfono: ${ticketData.phoneNumber}</div>` : ""}
          ${imprimirCajero && ticketData.cajero ? `<div>Atendió: ${ticketData.cajero}</div>` : ""}
          ${ticketData.tipoVenta ? `<div>Tipo de venta: ${ticketData.tipoVenta === "local" ? "Local" : "Teléfono"}</div>` : ""}
        </div>
        
        <div class="divider"></div>
        
        <div class="items">
          ${ticketData.items
            .map(
              (item) => `
  <div class="item">
    <div class="item-name">${item.nombre} x ${item.cantidad}</div>
    ${item.variante ? `<div class="item-detail">Tamaño: ${item.variante}</div>` : ""}
    ${item.withBoneless ? `<div class="item-detail" style="font-weight: bold; text-decoration: underline; font-size: 11px;">+ BONELESS ${item.bonelessSauce ? `(${item.bonelessSauce})` : ""}</div>` : ""}
    ${item.observaciones ? `<div class="item-detail">Obs: ${item.observaciones}</div>` : ""}
    <div style="display: flex; justify-content: space-between;">
      <span>${(item.precio).toFixed(2)}</span>
      <span>${(item.subtotal).toFixed(2)}</span>
    </div>
  </div>
`,
            )
            .join("")}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${ticketData.subtotal.toFixed(2)}</span>
          </div>
          
          ${
            ticketData.iva !== undefined
              ? `
            <div style="display: flex; justify-content: space-between;">
              <span>IVA:</span>
              <span>${ticketData.iva.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <div style="display: flex; justify-content: space-between;" class="bold">
            <span>Total:</span>
            <span>${ticketData.total.toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>Método de pago:</span>
            <span>${ticketData.metodoPago}</span>
          </div>
          
          ${
            ticketData.montoRecibido !== undefined
              ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Monto recibido:</span>
              <span>${ticketData.montoRecibido.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          ${
            ticketData.cambio !== undefined
              ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Cambio:</span>
              <span>${ticketData.cambio.toFixed(2)}</span>
            </div>
          `
              : ""
          }
        </div>
        
        <div class="footer">
          ${textoPie ? textoPie : "¡Gracias por su compra!"}
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

// Función para previsualizar el ticket
export async function previewTicket(ticketData: TicketData): Promise<boolean> {
  try {
    // Obtener la configuración de la impresora
    const config = await getPrinterConfig()

    // Crear el contenido del ticket
    const ticketContent = await generateTicketHTML(ticketData, config)

    // Abrir una ventana de vista previa
    const previewWindow = window.open("", "_blank")

    if (!previewWindow) {
      console.error("No se pudo abrir la ventana de vista previa. Verifica que no esté bloqueada por el navegador.")
      return false
    }

    previewWindow.document.write(ticketContent)
    previewWindow.document.close()

    return true
  } catch (error) {
    console.error("Error al previsualizar ticket:", error)
    return false
  }
}
