import { useEffect, useState } from 'react'
import { supabase, ESTADOS, linkWhatsAppEstatus } from '../supabaseClient'

export default function TicketDetail({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null)
  const [pagos, setPagos] = useState([])
  const [costos, setCostos] = useState([])
  const [loading, setLoading] = useState(true)

  const [nuevoPagoMonto, setNuevoPagoMonto] = useState('')
  const [nuevoPagoTipo, setNuevoPagoTipo] = useState('abono')
  const [nuevoCostoDesc, setNuevoCostoDesc] = useState('')
  const [nuevoCostoMonto, setNuevoCostoMonto] = useState('')

  const [copiado, setCopiado] = useState(false)
  const [mostrarModalPagado, setMostrarModalPagado] = useState(false)

  useEffect(() => {
    cargarTodo()
  }, [ticketId])

  async function cargarTodo() {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('tickets').select('*, clientes(nombre, telefono, email)').eq('id', ticketId).single(),
      supabase.from('pagos').select('*').eq('ticket_id', ticketId).order('fecha_pago', { ascending: false }),
      supabase.from('costos_refaccion').select('*').eq('ticket_id', ticketId),
    ])
    setTicket(t)
    setPagos(p || [])
    setCostos(c || [])
    setLoading(false)
  }

  async function cambiarEstado(nuevoEstado) {
    const updates = { estado: nuevoEstado }
    if (nuevoEstado === 'entregado') updates.fecha_entrega = new Date().toISOString()

    await supabase.from('tickets').update(updates).eq('id', ticketId)
    cargarTodo()
  }

  async function registrarPago(e) {
    e.preventDefault()
    if (!nuevoPagoMonto || parseFloat(nuevoPagoMonto) <= 0) return

    const montoNuevo = parseFloat(nuevoPagoMonto)

    await supabase.from('pagos').insert({
      ticket_id: ticketId,
      monto: montoNuevo,
      tipo: nuevoPagoTipo,
    })

    setNuevoPagoMonto('')
    await cargarTodo()

    // Si con este pago se cubre el costo total del ticket, avisamos con un modal.
    if (ticket.costo_total != null) {
      const nuevoTotalPagado = totalPagado + montoNuevo
      if (nuevoTotalPagado >= ticket.costo_total - 0.01) {
        setMostrarModalPagado(true)
      }
    }
  }

  async function registrarCosto(e) {
    e.preventDefault()
    if (!nuevoCostoDesc.trim() || !nuevoCostoMonto) return

    await supabase.from('costos_refaccion').insert({
      ticket_id: ticketId,
      descripcion: nuevoCostoDesc.trim(),
      costo: parseFloat(nuevoCostoMonto),
    })

    setNuevoCostoDesc('')
    setNuevoCostoMonto('')
    cargarTodo()
  }

  function copiarLinkPublico() {
    const url = `${window.location.origin}/estado/${ticket.codigo}`
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function enviarWhatsApp() {
    const link = linkWhatsAppEstatus({
      telefono: ticket.clientes?.telefono,
      nombreCliente: ticket.clientes?.nombre,
      equipo: `${ticket.equipo_marca} ${ticket.equipo_modelo}`,
      estado: ticket.estado,
      codigo: ticket.codigo,
    })
    window.open(link, '_blank')
  }

  if (loading || !ticket) {
    return <div className="page"><p className="text-muted">Cargando ticket...</p></div>
  }

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
  const saldoPendiente = ticket.costo_total != null ? ticket.costo_total - totalPagado : null
  const totalCostosRefaccion = costos.reduce((sum, c) => sum + Number(c.costo), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="nav-link" onClick={onBack} style={{ paddingLeft: 0, marginBottom: 8 }}>← Volver a tickets</button>
          <h1>Ticket <span className="mono">{ticket.codigo}</span></h1>
          <p>{ticket.clientes?.nombre} · {ticket.clientes?.telefono}</p>
        </div>
        <button className="btn btn-secondary" onClick={copiarLinkPublico}>
          {copiado ? 'Enlace copiado' : 'Copiar enlace público'}
        </button>
        <button className="btn btn-primary" onClick={enviarWhatsApp} style={{ marginLeft: 8 }}>
          Enviar estatus por WhatsApp
        </button>
      </div>

      {mostrarModalPagado && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Pago completado</h2>
            <p>
              La reparación del {ticket.equipo_marca} {ticket.equipo_modelo} (ticket <span className="mono">{ticket.codigo}</span>) ha sido pagada en su totalidad.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setMostrarModalPagado(false)
                onBack()
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted" style={{ margin: 0 }}>Equipo</p>
            <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{ticket.equipo_marca} {ticket.equipo_modelo}</p>
          </div>
          <div>
            <label style={{ marginBottom: 4 }}>Estado</label>
            <select value={ticket.estado} onChange={(e) => cambiarEstado(e.target.value)} style={{ minWidth: 200 }}>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-muted" style={{ marginTop: 16 }}>Falla reportada: {ticket.falla_reportada}</p>
      </div>

      <div className="card">
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>Cuenta</p>
        <div className="flex gap-12" style={{ marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p className="text-muted" style={{ margin: 0 }}>Costo total</p>
            <p className="text-lg-bold">{ticket.costo_total != null ? `$${Number(ticket.costo_total).toFixed(2)}` : 'Por definir'}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-muted" style={{ margin: 0 }}>Pagado</p>
            <p className="text-lg-bold">${totalPagado.toFixed(2)}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-muted" style={{ margin: 0 }}>Saldo pendiente</p>
            <p className="text-lg-bold" style={{ color: saldoPendiente > 0 ? 'var(--danger)' : 'var(--brand)' }}>
              {saldoPendiente != null ? `$${saldoPendiente.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        <table style={{ marginBottom: 16 }}>
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th></tr></thead>
          <tbody>
            {pagos.length === 0 && (
              <tr><td colSpan={3} className="text-muted">Aún no se han registrado pagos.</td></tr>
            )}
            {pagos.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.fecha_pago).toLocaleDateString('es-MX')}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.tipo.replace('_', ' ')}</td>
                <td>${Number(p.monto).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={registrarPago} className="flex gap-12 items-center">
          <input
            type="number" step="0.01" placeholder="Monto"
            value={nuevoPagoMonto} onChange={(e) => setNuevoPagoMonto(e.target.value)}
            style={{ maxWidth: 140 }}
          />
          <select value={nuevoPagoTipo} onChange={(e) => setNuevoPagoTipo(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="abono">Abono</option>
            <option value="pago_final">Pago final</option>
          </select>
          <button type="submit" className="btn btn-primary">Registrar pago</button>
        </form>
      </div>

      <div className="card">
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
          Costos de refacción (para calcular ganancia neta)
        </p>
        <table style={{ marginBottom: 16 }}>
          <thead><tr><th>Descripción</th><th>Costo</th></tr></thead>
          <tbody>
            {costos.length === 0 && (
              <tr><td colSpan={2} className="text-muted">Sin refacciones registradas.</td></tr>
            )}
            {costos.map((c) => (
              <tr key={c.id}>
                <td>{c.descripcion}</td>
                <td>${Number(c.costo).toFixed(2)}</td>
              </tr>
            ))}
            {costos.length > 0 && (
              <tr><td style={{ fontWeight: 600 }}>Total</td><td style={{ fontWeight: 600 }}>${totalCostosRefaccion.toFixed(2)}</td></tr>
            )}
          </tbody>
        </table>

        <form onSubmit={registrarCosto} className="flex gap-12 items-center">
          <input
            placeholder="Descripción (ej. pantalla)"
            value={nuevoCostoDesc} onChange={(e) => setNuevoCostoDesc(e.target.value)}
          />
          <input
            type="number" step="0.01" placeholder="Costo"
            value={nuevoCostoMonto} onChange={(e) => setNuevoCostoMonto(e.target.value)}
            style={{ maxWidth: 140 }}
          />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>
      </div>
    </div>
  )
}
