import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function GestionAdmins() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('tecnico')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok' | 'error', texto }

  async function handleSubmit(e) {
    e.preventDefault()
    setMensaje(null)

    if (!nombre.trim() || !email.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa el nombre y el correo.' })
      return
    }

    setEnviando(true)

    // Necesitamos el token de la sesión actual para que la función del
    // servidor pueda verificar que quien invita de verdad es un admin.
    const { data: { session } } = await supabase.auth.getSession()

    const redirectTo = `${window.location.origin}/actualizar-password`

    try {
      const res = await fetch('/.netlify/functions/invite-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), rol, redirectTo }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'No se pudo enviar la invitación.' })
      } else {
        setMensaje({ tipo: 'ok', texto: `Invitación enviada a ${email.trim()}.` })
        setNombre('')
        setEmail('')
        setRol('tecnico')
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor: ' + err.message })
    }

    setEnviando(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Administradores</h1>
          <p>Invita a nuevos administradores o técnicos por correo electrónico.</p>
        </div>
      </div>

      <div className="card">
        {mensaje && (
          <div className={mensaje.tipo === 'ok' ? 'form-error' : 'form-error'}
               style={mensaje.tipo === 'ok' ? { background: 'var(--st-listo-bg)', color: 'var(--st-listo-fg)' } : {}}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana Torres" />
            </div>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@ejemplo.com" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="rol">Rol</label>
            <select id="rol" value={rol} onChange={(e) => setRol(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando ? 'Enviando invitación...' : 'Enviar invitación'}
          </button>
        </form>
      </div>

      <p className="text-muted mt-24">
        La persona recibirá un correo con un enlace para crear su propia contraseña.
        Nadie en el taller, ni siquiera tú, ve o define su contraseña — así queda solo bajo su control.
      </p>
    </div>
  )
}
