import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, ESTADOS, MENSAJES_ESTADO } from '../supabaseClient'

export default function PublicStatus() {
  const { codigo } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noEncontrado, setNoEncontrado] = useState(false)

  useEffect(() => {
    buscarTicket()
  }, [codigo])

  async function buscarTicket() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vista_saldo_ticket')
      .select('*')
      .eq('codigo', codigo)
      .maybeSingle()

    if (error || !data) {
      setNoEncontrado(true)
    } else {
      setTicket(data)
    }
    setLoading(false)
  }

  const labelEstado = ESTADOS.find((e) => e.value === ticket?.estado)?.label

  return (
    <div className="public-wrap">
      <div className="public-card">
        <div className="public-brand">Taller de reparación</div>

        {loading && <p className="public-muted">Consultando tu ticket...</p>}

        {!loading && noEncontrado && (
          <div className="public-empty">
            <p>No encontramos un ticket con el código <strong>{codigo}</strong>.</p>
            <p className="public-muted">Verifica el enlace o contacta directamente al local.</p>
          </div>
        )}

        {!loading && ticket && (
          <>
            <span className={`public-badge public-badge-${ticket.estado}`}>{labelEstado}</span>

            <p className="public-equipo">{ticket.equipo_marca} {ticket.equipo_modelo}</p>
            <p className="public-mensaje">{MENSAJES_ESTADO[ticket.estado]}</p>

            {ticket.costo_total != null && (
              <div className="public-cuenta">
                <div className="public-cuenta-row">
                  <span>Costo total</span>
                  <span>${Number(ticket.costo_total).toFixed(2)}</span>
                </div>
                <div className="public-cuenta-row">
                  <span>Ya pagado</span>
                  <span>${Number(ticket.total_pagado).toFixed(2)}</span>
                </div>
                <div className="public-cuenta-row public-cuenta-saldo">
                  <span>Saldo a pagar</span>
                  <span>${Number(ticket.saldo_pendiente).toFixed(2)}</span>
                </div>
              </div>
            )}

            <p className="public-codigo">Ticket {ticket.codigo}</p>
          </>
        )}
      </div>
    </div>
  )
}
