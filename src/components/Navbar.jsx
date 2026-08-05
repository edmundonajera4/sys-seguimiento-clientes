import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { NEGOCIO } from '../config'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingRole, setLoadingRole] = useState(true)

  // Cargar usuario autenticado
  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      if (!session?.user) {
        setLoadingRole(false)
        return
      }

      // Verificar rol
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('auth_user_id', session.user.id)
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

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session?.user) {
        setIsAdmin(false)
        setLoadingRole(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>{NEGOCIO.nombre}</h1>
        </Link>
      </div>

      {user ? (
        <div className="navbar-menu">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tickets">Tickets</Link>
          <Link to="/balance">Balance</Link>
          
          {!loadingRole && isAdmin && (
            <Link to="/balance-historico" className="admin-link">
              Balance Histórico
            </Link>
          )}
          
          <Link to="/password">Contraseña</Link>
          <button onClick={handleLogout}>Salir</button>
        </div>
      ) : (
        <div className="navbar-menu">
          <Link to="/login">Login</Link>
        </div>
      )}
    </nav>
  )
}