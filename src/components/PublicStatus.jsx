import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const MENSAJES_ESTADO = {
  recibido: 'Hemos recibido tu equipo. Estamos iniciando el proceso.',
  diagnostico: 'Estamos diagnosticando tu equipo.',
  reparacion: 'Tu equipo está en reparación.',
  espera_refaccion: 'Estamos esperando refacciones para continuar.',
  listo: '¡Tu equipo está listo para recoger!',
  entregado: '¡Gracias por tu confianza! Equipo entregado.',
}

export default function PublicStatus() {
  const { codigo } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTicket() {
      if (!codigo) {
        setError('Código de ticket no proporcionado')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/.netlify/functions/public-ticket?codigo=${encodeURIComponent(codigo)}`, {
          headers: { Accept: 'application/json' },
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok || !payload.ticket) {
          throw new Error(payload.error || 'Ticket no encontrado')
        }

        setTicket(payload.ticket)
      } catch (err) {
        console.error('Error al consultar el ticket público:', err)
        setError(err.message || 'No se pudo consultar el ticket')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [codigo])

  function formatMoney(amount) {
    if (amount === null || amount === undefined) return '$0.00'
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  if (loading) {
    return <div className="public-wrap"><div className="public-card public-loading"><div className="public-brand">Cargando...</div><p className="public-muted">Consultando tu ticket</p></div></div>
  }

  if (error) {
    return <div className="public-wrap"><div className="public-card public-empty"><div className="public-brand">Taller de Reparación</div><p className="public-error">No pudimos consultar este ticket.</p><p className="public-muted">Verifica el enlace o contacta directamente al local.</p></div></div>
  }

  const labelEstado = ticket.estado.toUpperCase().replace('_', ' ')
  const saldoListoParaEntrega = ticket.saldo !== null && Number(ticket.saldo) <= 0

  return (
    <div className="public-wrap">
      <div className="public-card">
        <div className="public-brand">Taller de Reparación</div>
        <span className={`public-badge public-badge-${ticket.estado}`}>{labelEstado}</span>
        <p className="public-equipo">{ticket.equipo_marca} {ticket.equipo_modelo}</p>
        <p className="public-mensaje">{MENSAJES_ESTADO[ticket.estado]}</p>

        {ticket.costo_total != null && (
          <div className="public-cuenta">
            <h3 className="public-cuenta-title">Detalles de cobro</h3>
            <div className="public-cuenta-row"><span>Costo total</span><span>{formatMoney(ticket.costo_total)}</span></div>
            <div className="public-cuenta-row"><span>Total pagado</span><span>{formatMoney(ticket.total_pagado)}</span></div>
            <div className={`public-cuenta-row public-cuenta-saldo ${saldoListoParaEntrega ? 'public-saldo-ok' : ''}`}>
              <span>Saldo a pagar</span>
              <span className="public-saldo-amount">{saldoListoParaEntrega ? '✓ Listo para entrega' : formatMoney(ticket.saldo)}</span>
            </div>
          </div>
        )}

        {ticket.fecha_recepcion && <p className="public-reception-date">Recepción: {formatDate(ticket.fecha_recepcion)}</p>}
        <p className="public-codigo">Ticket {ticket.codigo}</p>
        <div className="public-footer"><p className="public-muted">Si tienes dudas, contáctanos con este código</p></div>
      </div>
    </div>
  )
}
