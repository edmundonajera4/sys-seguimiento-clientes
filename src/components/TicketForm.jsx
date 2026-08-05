import { useState } from 'react'
import QRCode from 'qrcode'
import { supabase, generarCodigoTicket, urlEstadoTicket, linkWhatsAppEstatus } from '../supabaseClient'
import { NEGOCIO } from '../config'

export default function TicketForm({ onCreated, usuarioNombre }) {
  const [telefono, setTelefono] = useState('')
  const [telefonoConPrefijo, setTelefonoConPrefijo] = useState('')  // ← SOLO UNA VEZ AQUÍ
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [telefonoConPrefijo, setTelefonoConPrefijo] = useState('')


  const [equipoMarca, setEquipoMarca] = useState('')
  const [equipoModelo, setEquipoModelo] = useState('')
  const [numero_serie, setNumeroSerie] = useState('')
  const [imei, setImei] = useState('')
  const [falla, setFalla] = useState('')
  const [costoTotal, setCostoTotal] = useState('')
  const [abono, setAbono] = useState('')

  const [loading, setLoading] = useState(false)
<<<<<<< HEAD
=======

>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Ticket recién creado, para mostrar la pantalla de QR + WhatsApp
  const [ticketCreado, setTicketCreado] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Manejar teléfono con +52 automático
  function manejarTelefono(value) {
    const soloNumeros = value.replace(/\D/g, '')
    
    let telefonoFinal = value
    
    if (soloNumeros.length === 10 && !value.startsWith('+')) {
      telefonoFinal = '+52' + soloNumeros
      setTelefonoConPrefijo(telefonoFinal)
    } else if (value.startsWith('+52')) {
      setTelefonoConPrefijo(value)
    } else if (value.startsWith('+')) {
      setTelefonoConPrefijo(value)
    } else {
      setTelefonoConPrefijo('')
    }
    
    setTelefono(value)
  }

  async function buscarClientePorTelefono() {
    // Usa el teléfono SIN el prefijo para buscar en la base de datos
    // (los números se guardan en la BD sin +52 para facilitar búsqueda)
    const telefonoBusqueda = telefono.replace(/\D/g, '').slice(-10) // Últimos 10 dígitos
    
    if (!telefonoBusqueda) return
    
    setBuscandoCliente(true)
    
    const telefonoBusqueda = telefono.replace(/\D/g, '').slice(-10)
    
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefonoBusqueda)
      .maybeSingle()

    if (data) {
      setClienteEncontrado(data)
      setNombreCliente(data.nombre)
      setEmailCliente(data.email || '')
      
<<<<<<< HEAD
      if (data.telefono.length === 10 && !telefonoConPrefijo.includes('+')) {
        setTelefonoConPrefijo('+52' + data.telefono)
=======
      // Mostrar el teléfono con prefijo si estaba incompleto
      if (data.telefono.length === 10 && !telefonoConPrefijo.includes('+')) {
        const nuevoConPrefijo = '+52' + data.telefono
        setTelefonoConPrefijo(nuevoConPrefijo)
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
      }
    } else {
      setClienteEncontrado(null)
    }
    setBuscandoCliente(false)
  }

  // Nueva función para manejar el teléfono con prefijo automático
  function manejarTelefono(value) {
    // Limpiar caracteres no numéricos
    const soloNumeros = value.replace(/\D/g, '')
    
    let telefonoFinal = value
    
    // Si tiene exactamente 10 dígitos y no tiene prefijo internacional
    if (soloNumeros.length === 10 && !value.startsWith('+')) {
      // Agregar prefijo de México
      telefonoFinal = '+52' + soloNumeros
      setTelefonoConPrefijo(telefonoFinal)
    } else if (value.startsWith('+52')) {
      // Ya tiene prefijo, mantenerlo
      telefonoFinal = value
      setTelefonoConPrefijo(telefonoFinal)
    } else if (value.startsWith('+') && value.length > 2) {
      // Tiene otro prefijo internacional (+1, +34, etc.)
      setTelefonoConPrefijo(value)
    } else {
      // No cumple condiciones, limpiar
      setTelefonoConPrefijo('')
    }
    
    // Actualizar el estado normal también (para mostrar lo que el usuario escribió)
    setTelefono(value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validaciones
    if (!nombreCliente.trim() || !telefono.trim()) {
      setError('El nombre y teléfono del cliente son obligatorios.')
      setLoading(false)
      return
    }
    if (!equipoMarca.trim() || !equipoModelo.trim() || !falla.trim()) {
      setError('Completa la marca, modelo y falla reportada del equipo.')
      setLoading(false)
      return
    }

    setGuardando(true)

    let clienteId = clienteEncontrado?.id
    let nombreFinal = nombreCliente.trim()

    if (!clienteId) {
<<<<<<< HEAD
      const telefonoLimpio = telefono.replace(/\D/g, '').slice(-10)
      
=======
      // Cliente nuevo, crearlo con el teléfono limpio (sin prefijos)
      // Esto facilita búsqueda y comparaciones futuras
      const telefonoLimpio = telefono.replace(/\D/g, '').slice(-10)

>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({ 
          nombre: nombreFinal, 
          telefono: telefonoLimpio,
          email: emailCliente.trim() || null 
        })
        .select()
        .single()

      if (errCliente) {
        setError('No se pudo registrar al cliente: ' + errCliente.message)
        setGuardando(false)
        setLoading(false)
        return
      }
      clienteId = nuevoCliente.id
    } else {
      // Cliente existente, actualizar datos si cambió
      await supabase
        .from('clientes')
        .update({ 
          nombre: nombreFinal,
          email: emailCliente.trim() || null
        })
        .eq('id', clienteId)
    }

<<<<<<< HEAD
=======
    // 2. Crear el ticket con los nuevos campos (serial e IMEI)
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
    const codigo = generarCodigoTicket()
    const { data: nuevoTicket, error: errTicket } = await supabase
      .from('tickets')
      .insert({
        codigo,
        cliente_id: clienteId,
        equipo_marca: equipoMarca.trim(),
        equipo_modelo: equipoModelo.trim(),
<<<<<<< HEAD
        numero_serie: numero_serie.trim() || null,
        imei: imei.trim() || null,
=======
        numero_serie: numero_serie.trim() || null,  // 👈 NUEVO
        imei: imei.trim() || null,                   // 👈 NUEVO
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
        falla_reportada: falla.trim(),
        costo_total: costoTotal ? parseFloat(costoTotal) : null,
        abono: abono ? parseFloat(abono) : 0,
      })
      .select()
      .single()

    if (errTicket) {
      setError('No se pudo crear el ticket: ' + errTicket.message)
      setGuardando(false)
      setLoading(false)
      return
    }

    setLoading(false)

<<<<<<< HEAD
=======
    // 3. Si hubo abono inicial, registrarlo también en la tabla de pagos
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
    if (abono && parseFloat(abono) > 0) {
      const { error: pagoError } = await supabase.from('pagos').insert({
        ticket_id: nuevoTicket.id,
        monto: parseFloat(abono),
        tipo: 'abono',
      })
<<<<<<< HEAD
      if (pagoError) console.warn('Error al registrar abono:', pagoError.message)
=======
      
      if (pagoError) {
        console.warn('Error al registrar abono:', pagoError.message)
        // Advertencia no crítica, el ticket se creó correctamente
      }
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
    }

    const url = urlEstadoTicket(nuevoTicket.codigo)
    const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 })
    setQrDataUrl(dataUrl)

    let telefonoWhatsapp = telefono.replace(/\D/g, '').slice(-10)
    if (telefonoWhatsapp.length === 10) {
      telefonoWhatsapp = '+52' + telefonoWhatsapp
    }

    setTicketCreado({
      id: nuevoTicket.id,
      codigo: nuevoTicket.codigo,
<<<<<<< HEAD
      telefono: telefonoWhatsapp,
=======
      telefono: telefono.trim(),
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
      nombreCliente: nombreFinal,
      equipo: `${equipoMarca.trim()} ${equipoModelo.trim()}`,
      trabajador: usuarioNombre || '—',
    })

    setGuardando(false)
  }

  function imprimirTicket() {
    const ventana = window.open('', '_blank', 'width=420,height=620')
    ventana.document.write(`
      <html>
        <head><title>Ticket ${ticketCreado.codigo}</title>
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
    // El número para WhatsApp necesita el código de país completo
    let numeroWhatsapp = ticketCreado.telefono
    
    // Si tiene 10 dígitos, agregar +52
    const soloNumeros = numeroWhatsapp.replace(/\D/g, '')
    if (soloNumeros.length === 10 && !numeroWhatsapp.startsWith('+52')) {
      numeroWhatsapp = '+52' + soloNumeros
    }
    
    const link = linkWhatsAppEstatus({
      telefono: numeroWhatsapp,
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
          <div><h1>Ticket creado</h1><p>Imprime el QR o envía el estatus por WhatsApp.</p></div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            {ticketCreado.codigo}
          </p>
          {qrDataUrl && <img src={qrDataUrl} alt={`QR`} width={220} height={220} />}
          <p className="text-muted" style={{ marginTop: 16 }}>
            {ticketCreado.equipo} — {ticketCreado.nombreCliente}
          </p>
          <div className="flex gap-12" style={{ justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={imprimirTicket}>Imprimir ticket</button>
            <button className="btn btn-primary" onClick={enviarWhatsApp}>Enviar por WhatsApp</button>
          </div>
          <button className="nav-link" style={{ marginTop: 20 }} onClick={() => onCreated(ticketCreado.id)}>
            Ir al ticket →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Nuevo ticket</h1><p>Registra el equipo que acaba de recibirse.</p></div>
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
                onChange={(e) => manejarTelefono(e.target.value)}
                onBlur={buscarClientePorTelefono}
                placeholder="Ej. 4491234567 (+52 se agrega automático)"
              />
              {telefonoConPrefijo && telefonoConPrefijo !== telefono && (
                <p className="text-muted text-sm" style={{marginTop: '4px', fontSize: '12px'}}>
                  📱 Guardando como: {telefonoConPrefijo}
                </p>
              )}
              {buscandoCliente && <span className="text-muted">Buscando cliente...</span>}
              {clienteEncontrado && (
                <span className="text-muted">Cliente existente encontrado.</span>
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
<<<<<<< HEAD
=======
            {/* 👇 CAMPOS NUEVOS: SERIAL Y IMEI */}
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
            <div className="field">
              <label htmlFor="numero_serie">Número de Serie</label>
              <input 
                id="numero_serie"
<<<<<<< HEAD
=======
                type="text"
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
                value={numero_serie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                maxLength={50}
                placeholder="Ej: ABC123XYZ789"
              />
            </div>
            <div className="field">
              <label htmlFor="imei">IMEI</label>
              <input
                id="imei"
<<<<<<< HEAD
=======
                type="tel"
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
                value={imei}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, '');
                  if (valor.length <= 17) setImei(valor);
                }}
                maxLength={17}
                placeholder="15-17 dígitos"
<<<<<<< HEAD
              />
=======
                title="Ingresa solo números (15-17 dígitos)"
              />
              <p className="text-xs text-gray-500 mt-1" style={{marginTop: '4px', fontSize: '11px'}}>
                Estándar GSM. Solo ingresa números.
              </p>
>>>>>>> 5e29b3a49fdc629e49784903b43451cbba04f390
            </div>
          </div>
          <div className="field">
            <label htmlFor="falla">Falla reportada</label>
            <textarea 
              id="falla" 
              rows={3} 
              value={falla} 
              onChange={(e) => setFalla(e.target.value)} 
              placeholder="Descripción de lo que reporta el cliente" 
            />
          </div>
        </div>

        <div className="card">
          <p className="text-muted" style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>Costos (opcional)</p>
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