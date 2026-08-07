import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthProvider'
import { NEGOCIO } from '../config'

export default function Navbar() {
  const auth = useAuth()
  const { user } = auth || {}
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingRole, setLoadingRole] = useState(true)
  const location = useLocation()

  useEffect(() => {
    async function checkUserRole() {
      if (!user) {
        setIsAdmin(false)
        setLoadingRole(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('auth_user_id', user.id)
          .single()

        if (error) {
          console.error('Error al obtener rol:', error.message)
          setIsAdmin(false)
        } else {
          setIsAdmin(data?.rol === 'admin')
        }
      } catch (err) {
        console.error('Error inesperado:', err.message)
        setIsAdmin(false)
      } finally {
        setLoadingRole(false)
      }
    }

    checkUserRole()
  }, [user])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Helper para marcar el link activo
  function linkClass(path) {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
    return `nav-link${isActive ? ' active' : ''}`
  }

  return (
    <nav className="navbar">
      {/* ── Brand ──────────────────────────────── */}
      <Link to="/tickets" className="navbar-brand">
        <div className="navbar-brand-icon">🔧</div>
        <span className="navbar-brand-text">{NEGOCIO.nombre}</span>
      </Link>

      {/* ── Links centrales ────────────────────── */}
      {user ? (
        <div className="navbar-links">
          <Link to="/tickets"   className={linkClass('/tickets')}>📋 Tickets</Link>
          <Link to="/balance"   className={linkClass('/balance')}>💰 Balance</Link>
          {!loadingRole && isAdmin && (
            <>
              <Link to="/balance-historico" className={linkClass('/balance-historico')}>📊 Histórico</Link>
              <Link to="/admins"            className={linkClass('/admins')}>👥 Usuarios</Link>
            </>
          )}
        </div>
      ) : (
        <div className="navbar-links" />
      )}

      {/* ── Usuario + Logout ───────────────────── */}
      {user ? (
        <div className="navbar-user">
          <span className="navbar-user-email">{user.email}</span>
          <Link to="/password" className="nav-link" style={{ padding: '5px 10px', fontSize: '13px' }}>
            ⚙️
          </Link>
          <button className="btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </div>
      ) : (
        <Link to="/login" className="nav-link">
          Iniciar sesión
        </Link>
      )}
    </nav>
  )
}