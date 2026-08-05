import { useEffect, useState } from 'react'
import { supabase, ESTADOS } from '../supabaseClient'

export default function TicketList({ onSelectTicket }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  

  useEffect(() => {
    cargarTickets()
  }, [filtroEstado])

  async function cargarTickets() {
    setLoading(true)

    let query = supabase
      .from('tickets')
      .select('id, codigo, equipo_marca, equipo_modelo, estado, costo_total, abono, fecha_recepcion, clientes(nombre, telefono), numero_serie, imei')
      .order('fecha_recepcion', { ascending: false })

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data, error } = await query

    if (!error) setTickets(data || [])
    setLoading(false)
  }



  const ticketsFiltrados = tickets.filter((t) => {
    if (!busqueda.trim()) return true
    const texto = busqueda.toLowerCase()
    return (
      t.codigo.toLowerCase().includes(texto) ||
      t.clientes?.nombre?.toLowerCase().includes(texto) ||
      t.equipo_modelo?.toLowerCase().includes(texto)
    )

    const { data } = await supabase
      .from('tickets')
      .select('*, cliente(nombre)')
      .or(`numero_serie.ilike.%${busqueda}%,imei.ilike.%${busqueda}%`);
  })

  function labelEstado(valor) {
    return ESTADOS.find((e) => e.value === valor)?.label || valor
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Todos los equipos recibidos en el taller.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-12" style={{ marginBottom: 20 }}>
          <input
            placeholder="Buscar por código, cliente o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-muted">Cargando tickets...</p>
        ) : ticketsFiltrados.length === 0 ? (
          <div className="empty-state">
            No hay tickets que coincidan. Crea uno nuevo desde "Nuevo ticket".
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Estado</th>
                <th>Serial</th>
                <th>IMEI</th>
                <th>Saldo</th>
                <th>Recibido</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.map((t) => {
                const saldo = t.costo_total != null ? t.costo_total - (t.abono || 0) : null
                return (
                  <tr key={t.id} className="clickable" onClick={() => onSelectTicket(t.id)}>
                    <td className="mono">{t.codigo}</td>
                    <td>{t.clientes?.nombre}</td>
                    <td>{t.equipo_marca} {t.equipo_modelo}</td>
                    <td className="font-mono" style={{ fontFamily: 'monospace' }}>
                      {ticket.numero_serie || '-'}
                    </td>
                    <td className="font-mono" style={{ fontFamily: 'monospace' }}>
                      <td>{t.imei || '-'}</td>
                    </td>
                    <td><span className={`badge badge-${t.estado}`}>
                      {labelEstado(t.estado)}</span>
                      </td>
                    <td>{saldo != null ? `$${saldo.toFixed(2)}` : '—'}</td>
                    <td className="text-muted">{new Date(t.fecha_recepcion).toLocaleDateString('es-MX')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
