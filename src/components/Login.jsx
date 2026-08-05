import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { NEGOCIO } from '../config'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (err) {
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
      return
    }

    // Login exitoso, redirigir a tickets
    navigate('/tickets')
  }

  async function handleSignUp() {
    setError('No puedes crear usuarios desde aquí. Contacta al administrador.')
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>{NEGOCIO.nombre}</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Inicia sesión para continuar</p>

        {error && <div className="form-error" style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          ¿No tienes cuenta? Contáctate con el administrador
        </p>
      </div>
    </div>
  )
}