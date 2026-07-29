import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ActualizarPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    // Supabase ya validó el enlace de invitación/recuperación y creó una
    // sesión temporal antes de que esta pantalla cargue, así que solo
    // necesitamos actualizar la contraseña del usuario ya identificado.
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError('No se pudo actualizar la contraseña: ' + error.message)
    } else {
      setOk(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Crear contraseña</h1>
        <p className="subtitle">Define la contraseña con la que iniciarás sesión en el panel.</p>

        {error && <div className="form-error">{error}</div>}
        {ok && (
          <div className="form-error" style={{ background: 'var(--st-listo-bg)', color: 'var(--st-listo-fg)' }}>
            Contraseña actualizada. Entrando al panel...
          </div>
        )}

        {!ok && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="confirmar">Confirmar contraseña</label>
              <input
                id="confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
