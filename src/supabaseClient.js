import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Genera un código corto para el ticket, ej. "A3F9K2"
// Este código es el que se imprime en el QR y usa el cliente para consultar su estado.
export function generarCodigoTicket() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O/0/I/1 para evitar confusiones
  let codigo = ''
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return codigo
}

export const ESTADOS = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'diagnostico', label: 'En diagnóstico' },
  { value: 'reparacion', label: 'En reparación' },
  { value: 'espera_refaccion', label: 'Esperando refacción' },
  { value: 'listo', label: 'Listo para entrega' },
  { value: 'entregado', label: 'Entregado' },
]

// Mensajes amigables por estado, usados tanto en la página pública
// como en el mensaje de WhatsApp que se envía al cliente.
export const MENSAJES_ESTADO = {
  recibido: 'Recibimos tu equipo y está en cola para revisión.',
  diagnostico: 'Nuestro técnico está diagnosticando la falla.',
  reparacion: 'Tu equipo está en proceso de reparación.',
  espera_refaccion: 'Tu equipo está esperando una refacción para continuar.',
  listo: 'Tu equipo está listo. Ya puedes pasar por él al local.',
  entregado: 'Este equipo ya fue entregado. ¡Gracias por tu confianza!',
}

// Construye la URL pública de seguimiento de un ticket.
export function urlEstadoTicket(codigo) {
  return `${window.location.origin}/estado/${codigo}`
}

// Limpia un teléfono capturado y le antepone el código de país si hace falta.
// Asume México (52) por defecto para números locales de 10 dígitos.
// Si el cliente ya lo capturó con código de país, se respeta tal cual.
export function formatearTelefonoWhatsApp(telefono) {
  const soloDigitos = telefono.replace(/\D/g, '')
  if (soloDigitos.length === 10) return `52${soloDigitos}`
  return soloDigitos
}

// Genera el enlace de WhatsApp (wa.me) con el estatus del equipo prellenado.
export function linkWhatsAppEstatus({ telefono, nombreCliente, equipo, estado, codigo }) {
  const numero = formatearTelefonoWhatsApp(telefono)
  const url = urlEstadoTicket(codigo)
  const mensaje =
    `Hola ${nombreCliente}, este es el estatus de tu equipo (${equipo}): ` +
    `${MENSAJES_ESTADO[estado] || ''}\n\nPuedes ver el estatus en cualquier momento aquí: ${url}`

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}
