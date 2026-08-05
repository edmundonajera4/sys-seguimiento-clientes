import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function primerDiaMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString()
}
function primerDiaMesSiguiente(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1).toISOString()
}

export default function Balance() {
  const [loading, setLoading] = useState(true)
  const [pagos, setPagos] = useState([])
  const [refacciones, setRefacciones] = useState([])
  const [ticketsEntregados, setTicketsEntregados] = useState(0)
  const [mesActual] = useState(new Date())

  useEffect(() => {
    cargarBalance()
  }, [])

  async function cargarBalance() {
    setLoading(true)
    const desde = primerDiaMes(mesActual)
    const hasta = primerDiaMesSiguiente(mesActual)

    const { data: pagosData } = await supabase
      .from('pagos')
      .select('id, monto, tipo, fecha_pago, tickets(codigo, equipo_marca, equipo_modelo, clientes(nombre))')
      .gte('fecha_pago', desde)
      .lt('fecha_pago', hasta)
      .order('fecha_pago', { ascending: false })

    const { data: refaccionesData } = await supabase
      .from('costos_refaccion')
      .select('id, descripcion, costo, fecha, tickets(codigo, equipo_marca, equipo_modelo)')
      .gte('fecha', desde)
      .lt('fecha', hasta)
      .order('fecha', { ascending: false })

    const { data: entregados } = await supabase
      .from('tickets')
      .select('id')
      .eq('estado', 'entregado')
      .gte('fecha_entrega', desde)
      .lt('fecha_entrega', hasta)

    setPagos(pagosData || [])
    setRefacciones(refaccionesData || [])
    setTicketsEntregados(entregados?.length || 0)
    setLoading(false)
  }

  const ingresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
  const costos = refacciones.reduce((sum, r) => sum + Number(r.costo), 0)
  const gananciaNeta = ingresos - costos
  const ticketPromedio = ticketsEntregados > 0 ? ingresos / ticketsEntregados : 0
  const nombreMes = mesActual.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Balance</h1>
          <p style={{ textTransform: 'capitalize' }}>{nombreMes}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Calculando...</p>
      ) : (
        <>
          <div className="flex gap-12">
            <div className="card" style={{ flex: 1 }}>
              <p className="text-muted" style={{ margin: 0 }}>Ingresos del mes</p>
              <p className="text-lg-bold">${ingresos.toFixed(2)}</p>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <p className="text-muted" style={{ margin: 0 }}>Costos de refacciones</p>
              <p className="text-lg-bold">${costos.toFixed(2)}</p>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <p className="text-muted" style={{ margin: 0 }}>Ganancia neta</p>
              <p className="text-lg-bold" style={{ color: 'var(--brand)' }}>${gananciaNeta.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-12 mt-24">
            <div className="card" style={{ flex: 1 }}>
              <p className="text-muted" style={{ margin: 0 }}>Reparaciones entregadas</p>
              <p className="text-lg-bold">{ticketsEntregados}</p>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <p className="text-muted" style={{ margin: 0 }}>Ticket promedio</p>
              <p className="text-lg-bold">${ticketPromedio.toFixed(2)}</p>
            </div>
          </div>

          <div className="card mt-24">
            <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
              Pagos registrados este mes
            </p>
            {pagos.length === 0 ? (
              <p className="text-muted">Aún no hay pagos registrados este mes.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Ticket</th>
                    <th>Equipo</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.fecha_pago).toLocaleDateString('es-MX')}</td>
                      <td>{p.tickets?.clientes?.nombre || '—'}</td>
                      <td className="mono">{p.tickets?.codigo || '—'}</td>
                      <td>{p.tickets ? `${p.tickets.equipo_marca} ${p.tickets.equipo_modelo}` : '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{p.tipo.replace('_', ' ')}</td>
                      <td>${Number(p.monto).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} style={{ fontWeight: 600 }}>Total</td>
                    <td style={{ fontWeight: 600 }}>${ingresos.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="card mt-24">
            <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
              Refacciones utilizadas o compradas este mes
            </p>
            {refacciones.length === 0 ? (
              <p className="text-muted">Aún no hay refacciones registradas este mes.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ticket</th>
                    <th>Equipo</th>
                    <th>Descripción</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {refacciones.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.fecha).toLocaleDateString('es-MX')}</td>
                      <td className="mono">{r.tickets?.codigo || '—'}</td>
                      <td>{r.tickets ? `${r.tickets.equipo_marca} ${r.tickets.equipo_modelo}` : '—'}</td>
                      <td>{r.descripcion}</td>
                      <td>${Number(r.costo).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 600 }}>Total</td>
                    <td style={{ fontWeight: 600 }}>${costos.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <p className="text-muted mt-24">
            Los ingresos se calculan por fecha de pago (abonos y pagos finales registrados este mes),
            y los costos de refacciones se calculan por su fecha de registro, no por la fecha de entrega del ticket.
          </p>
        </>
      )}
    </div>
  )
}
