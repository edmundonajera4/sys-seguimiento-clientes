import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [modo, setModo] = useState('login') // login | recuperar
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensajeOk, setMensajeOk] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    }
    // Si el login es exitoso, AdminApp.jsx detecta el cambio de sesión automáticamente.
  }

  async function handleRecuperar(e) {
    e.preventDefault()
    setError('')
    setMensajeOk('')

    if (!email.trim()) {
      setError('Escribe tu correo para poder enviarte el enlace.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/actualizar-password`,
    })
    setLoading(false)

    if (error) {
      setError('No se pudo enviar el correo: ' + error.message)
    } else {
      setMensajeOk('Si el correo existe en el sistema, te llegará un enlace para restablecer tu contraseña.')
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {modo === 'login' ? (
          <>
            <h1>Panel del taller</h1>
            <p className="subtitle">Inicia sesión con tu cuenta de staff.</p>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Correo</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button
              className="nav-link"
              style={{ marginTop: 16, width: '100%', textAlign: 'center' }}
              onClick={() => { setModo('recuperar'); setError(''); setMensajeOk('') }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        ) : (
          <>
            <h1>Recuperar contraseña</h1>
            <p className="subtitle">Te enviaremos un enlace a tu correo para crear una nueva.</p>

            {error && <div className="form-error">{error}</div>}
            {mensajeOk && (
              <div className="form-error" style={{ background: 'var(--st-listo-bg)', color: 'var(--st-listo-fg)' }}>
                {mensajeOk}
              </div>
            )}

            <form onSubmit={handleRecuperar}>
              <div className="field">
                <label htmlFor="emailRecuperar">Correo</label>
                <input
                  id="emailRecuperar"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <button
              className="nav-link"
              style={{ marginTop: 16, width: '100%', textAlign: 'center' }}
              onClick={() => { setModo('login'); setError(''); setMensajeOk('') }}
            >
              ← Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  )
}
