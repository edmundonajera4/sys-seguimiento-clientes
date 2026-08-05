import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  async function cargarTickets() {
    try {
      const { data, error: err } = await supabase
        .from('tickets')
        .select('*, cliente(nombre)')
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
      ticket.cliente?.nombre?.toLowerCase().includes(texto) ||
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function getEstadoBadgeClass(estado) {
    switch (estado) {
      case 'recibido': return 'badge-yellow'
      case 'en_proceso': return 'badge-blue'
      case 'lista_entrega': return 'badge-purple'
      case 'entregado': return 'badge-green'
      case 'cancelado': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  if (loading) {
    return <div className="page"><div className="card"><p>Cargando...</p></div></div>
  }

  if (error) {
    return (
      <div className="page">
        <div className="card">
          <h1>Error</h1>
          <p style={{ color: '#dc2626' }}>{error}</p>
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
          <p>Gestiona todos los equipos recibidos.</p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por código, cliente, modelo, serial o IMEI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
      </div>

      {/* CONTADOR DE RESULTADOS */}
      {busqueda && (
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          Mostrando {ticketsFiltrados.length} resultado(s)
        </p>
      )}

      {/* TABLA */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Código</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Fecha</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Equipo</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Serial</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>IMEI</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  No hay tickets registrados
                </td>
              </tr>
            ) : (
              ticketsFiltrados.map((ticket) => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>
                    <Link to={`/tickets/${ticket.id}`}>
                      {ticket.codigo}
                    </Link>
                  </td>
                  <td style={{ padding: '12px' }}>{formatFecha(ticket.fecha_recepcion)}</td>
                  <td style={{ padding: '12px' }}>{ticket.cliente?.nombre || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    {ticket.equipo_marca} {ticket.equipo_modelo}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {ticket.numero_serie || '—'}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {ticket.imei || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${getEstadoBadgeClass(ticket.estado)}`}>
                      {ticket.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <Link to={`/tickets/${ticket.id}`} className="nav-link">
                      Ver
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