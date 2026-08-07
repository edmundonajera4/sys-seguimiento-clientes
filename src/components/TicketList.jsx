import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // Función para cargar los tickets desde Supabase
  async function cargarTickets() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('tickets')
        .select('*, clientes(nombre)')
        .order('fecha_recepcion', { ascending: false })

      if (err) throw err
      setTickets(data || [])
    } catch (err) {
      console.error('Error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTickets()
  }, [])

  // Filtrar tickets según búsqueda
  const ticketsFiltrados = tickets.filter(ticket => {
    const texto = busqueda.toLowerCase()
    
    return (
      ticket.codigo?.toLowerCase().includes(texto) ||
      ticket.clientes?.nombre?.toLowerCase().includes(texto) ||
      ticket.equipo_marca?.toLowerCase().includes(texto) ||
      ticket.equipo_modelo?.toLowerCase().includes(texto) ||
      ticket.numero_serie?.toLowerCase().includes(texto) ||
      ticket.imei?.toLowerCase().includes(texto) ||
      ticket.falla_reportada?.toLowerCase().includes(texto)
    )
  })

  function formatFecha(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  const ESTADO_LABEL = {
    recibido: 'Recibido',
    diagnostico: 'En diagnóstico',
    reparacion: 'En reparación',
    espera_refaccion: 'Esp. refacción',
    listo: 'Listo',
    entregado: 'Entregado',
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Cargando tickets…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="card error-card">
          <span className="error-icon">⚠️</span>
          <h2>No se pudo cargar</h2>
          <p>{error}</p>
          <button onClick={cargarTickets} className="btn btn-secondary">Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Gestiona todos los equipos recibidos en el taller.</p>
        </div>
        <Link to="/tickets/nuevo" className="btn btn-primary">
          + Nuevo ticket
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Buscar por código, cliente, modelo, serial o IMEI…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <span className="search-count">{ticketsFiltrados.length} resultado(s)</span>
        )}
      </div>

      {/* TABLA */}
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Serial / IMEI</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📋</p>
                    <p style={{ fontWeight: 600, margin: '0 0 4px' }}>Sin resultados</p>
                    <p className="text-muted" style={{ margin: 0 }}>
                      {busqueda ? 'No hay coincidencias para tu búsqueda.' : 'Aún no hay tickets registrados.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              ticketsFiltrados.map((ticket) => (
                <tr key={ticket.id} className="clickable" onClick={() => window.location.href = `/tickets/${ticket.id}`}>
                  <td><span className="mono">{ticket.codigo}</span></td>
                  <td>{formatFecha(ticket.fecha_recepcion)}</td>
                  <td>{ticket.clientes?.nombre || <span className="text-muted">—</span>}</td>
                  <td>{ticket.equipo_marca} {ticket.equipo_modelo}</td>
                  <td className="mono" style={{ fontSize: '12px' }}>
                    {ticket.numero_serie || ticket.imei || <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <span className={`badge badge-${ticket.estado}`}>
                      {ESTADO_LABEL[ticket.estado] || ticket.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '5px 14px', fontSize: '13px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}