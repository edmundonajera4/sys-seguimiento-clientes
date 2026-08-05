import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabaseClient'
import { NEGOCIO } from '../config'

export default function Navbar() {
  const user = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingRole, setLoadingRole] = useState(true)

  // Verificar rol del usuario en base de datos
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
          
          {/* NUEVO: Enlace solo visible para admins */}
          {!loadingRole && isAdmin && (
            <Link to="/balance-historico" className="admin-link">
              Balance Histórico
            </Link>
          )}
          
          <Link to="/password">Contraseña</Link>
          <Link to="/logout">Salir</Link>
        </div>
      ) : (
        <div className="navbar-menu">
          <Link to="/login">Login</Link>
        </div>
      )}
    </nav>
  )
}