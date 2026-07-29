import { useState } from 'react'
import QRCode from 'qrcode'
import { supabase, generarCodigoTicket, urlEstadoTicket, linkWhatsAppEstatus } from '../supabaseClient'
import { NEGOCIO } from '../config'

export default function TicketForm({ onCreated, usuarioNombre }) {
  const [telefono, setTelefono] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  const [equipoMarca, setEquipoMarca] = useState('')
  const [equipoModelo, setEquipoModelo] = useState('')
  const [falla, setFalla] = useState('')
  const [costoTotal, setCostoTotal] = useState('')
  const [abono, setAbono] = useState('')

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Ticket recién creado, para mostrar la pantalla de QR + WhatsApp
  const [ticketCreado, setTicketCreado] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  async function buscarClientePorTelefono() {
    if (!telefono.trim()) return
    setBuscandoCliente(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono.trim())
      .maybeSingle()

    if (data) {
      setClienteEncontrado(data)
      setNombreCliente(data.nombre)
      setEmailCliente(data.email || '')
    } else {
      setClienteEncontrado(null)
    }
    setBuscandoCliente(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!nombreCliente.trim() || !telefono.trim()) {
      setError('El nombre y teléfono del cliente son obligatorios.')
      return
    }
    if (!equipoMarca.trim() || !equipoModelo.trim() || !falla.trim()) {
      setError('Completa la marca, modelo y falla reportada del equipo.')
      return
    }

    setGuardando(true)

    // 1. Obtener o crear cliente
    let clienteId = clienteEncontrado?.id

    if (!clienteId) {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({ nombre: nombreCliente.trim(), telefono: telefono.trim(), email: emailCliente.trim() || null })
        .select()
        .single()

      if (errCliente) {
        setError('No se pudo registrar al cliente: ' + errCliente.message)
        setGuardando(false)
        return
      }
      clienteId = nuevoCliente.id
    }

    // 2. Crear el ticket
    const codigo = generarCodigoTicket()
    const { data: nuevoTicket, error: errTicket } = await supabase
      .from('tickets')
      .insert({
        codigo,
        cliente_id: clienteId,
        equipo_marca: equipoMarca.trim(),
        equipo_modelo: equipoModelo.trim(),
        falla_reportada: falla.trim(),
        costo_total: costoTotal ? parseFloat(costoTotal) : null,
        abono: abono ? parseFloat(abono) : 0,
      })
      .select()
      .single()

    if (errTicket) {
      setError('No se pudo crear el ticket: ' + errTicket.message)
      setGuardando(false)
      return
    }

    // 3. Si hubo abono inicial, registrarlo también en la tabla de pagos
    if (abono && parseFloat(abono) > 0) {
      await supabase.from('pagos').insert({
        ticket_id: nuevoTicket.id,
        monto: parseFloat(abono),
        tipo: 'abono',
      })
    }

    // 4. Generar el QR con la URL pública de seguimiento
    const url = urlEstadoTicket(nuevoTicket.codigo)
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 })
    setQrDataUrl(dataUrl)
    setTicketCreado({
      id: nuevoTicket.id,
      codigo: nuevoTicket.codigo,
      telefono: telefono.trim(),
      nombreCliente: nombreCliente.trim(),
      equipo: `${equipoMarca.trim()} ${equipoModelo.trim()}`,
      trabajador: usuarioNombre || '—',
    })

    setGuardando(false)
  }

  function imprimirTicket() {
    const ventana = window.open('', '_blank', 'width=420,height=620')
    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${ticketCreado.codigo}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 24px; }
            img { width: 220px; height: 220px; }
            h1 { margin: 0 0 2px; font-size: 18px; }
            h2 { margin: 16px 0 4px; }
            p { color: #555; font-size: 13px; margin: 2px 0; }
            .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
            .footer { font-size: 12px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${NEGOCIO.nombre}</h1>
          <p>${NEGOCIO.direccion}</p>
          <p>Tel: ${NEGOCIO.telefono}</p>

          <div class="divider"></div>

          <h2>${ticketCreado.codigo}</h2>
          <p>Escanea para ver el estatus de tu equipo</p>
          <img src="${qrDataUrl}" />
          <p>${ticketCreado.equipo}</p>
          <p>Cliente: ${ticketCreado.nombreCliente}</p>
          <p>Atendió: ${ticketCreado.trabajador}</p>

          <div class="divider"></div>

          <p class="footer">${NEGOCIO.agradecimiento}</p>
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    ventana.print()
  }

  function enviarWhatsApp() {
    const link = linkWhatsAppEstatus({
      telefono: ticketCreado.telefono,
      nombreCliente: ticketCreado.nombreCliente,
      equipo: ticketCreado.equipo,
      estado: 'recibido',
      codigo: ticketCreado.codigo,
    })
    window.open(link, '_blank')
  }

  if (ticketCreado) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Ticket creado</h1>
            <p>Imprime el QR en el recibo o envía el estatus por WhatsApp.</p>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{ticketCreado.codigo}</p>
          {qrDataUrl && <img src={qrDataUrl} alt={`QR del ticket ${ticketCreado.codigo}`} width={220} height={220} />}
          <p className="text-muted" style={{ marginTop: 16 }}>{ticketCreado.equipo} — {ticketCreado.nombreCliente}</p>

          <div className="flex gap-12" style={{ justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={imprimirTicket}>Imprimir ticket</button>
            <button className="btn btn-primary" onClick={enviarWhatsApp}>Enviar por WhatsApp</button>
          </div>

          <button
            className="nav-link"
            style={{ marginTop: 20 }}
            onClick={() => onCreated(ticketCreado.id)}
          >
            Ir al ticket →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Nuevo ticket</h1>
          <p>Registra el equipo que acaba de recibirse.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="card">
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>Datos del cliente</p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={buscarClientePorTelefono}
                placeholder="Ej. 4491234567"
              />
              {buscandoCliente && <span className="text-muted">Buscando cliente...</span>}
              {clienteEncontrado && (
                <span className="text-muted">Cliente existente encontrado: se usarán sus datos.</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="nombreCliente">Nombre completo</label>
              <input
                id="nombreCliente"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                disabled={!!clienteEncontrado}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="emailCliente">Correo (opcional)</label>
            <input
              id="emailCliente"
              type="email"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
              disabled={!!clienteEncontrado}
            />
          </div>
        </div>

        <div className="card">
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>Datos del equipo</p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="marca">Marca</label>
              <input id="marca" value={equipoMarca} onChange={(e) => setEquipoMarca(e.target.value)} placeholder="Ej. Samsung" />
            </div>
            <div className="field">
              <label htmlFor="modelo">Modelo</label>
              <input id="modelo" value={equipoModelo} onChange={(e) => setEquipoModelo(e.target.value)} placeholder="Ej. Galaxy A54" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="falla">Falla reportada</label>
            <textarea id="falla" rows={3} value={falla} onChange={(e) => setFalla(e.target.value)} placeholder="Descripción de lo que reporta el cliente" />
          </div>
        </div>

        <div className="card">
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>Costos (opcional en este momento)</p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="costoTotal">Costo total estimado</label>
              <input id="costoTotal" type="number" step="0.01" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} placeholder="$" />
            </div>
            <div className="field">
              <label htmlFor="abono">Abono recibido hoy</label>
              <input id="abono" type="number" step="0.01" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder="$" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear ticket'}
        </button>
      </form>
    </div>
  )
}
