import { supabase } from '../supabaseClient'

export default function Navbar({ view, setView, usuarioNombre, usuarioRol }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <span className="dot" />
        Taller — Panel
      </div>

      <div className="navbar-links">
        <button
          className={`nav-link ${view === 'lista' ? 'active' : ''}`}
          onClick={() => setView('lista')}
        >
          Tickets
        </button>
        <button
          className={`nav-link ${view === 'nuevo' ? 'active' : ''}`}
          onClick={() => setView('nuevo')}
        >
          Nuevo ticket
        </button>
        <button
          className={`nav-link ${view === 'balance' ? 'active' : ''}`}
          onClick={() => setView('balance')}
        >
          Balance
        </button>
        {usuarioRol === 'admin' && (
          <button
            className={`nav-link ${view === 'admins' ? 'active' : ''}`}
            onClick={() => setView('admins')}
          >
            Administradores
          </button>
        )}
      </div>

      <div className="navbar-user">
        <span>{usuarioNombre || 'Staff'}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
