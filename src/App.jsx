import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Login from './components/Login'
import TicketList from './components/TicketList'
import TicketForm from './components/TicketForm'
import TicketDetail from './components/TicketDetail'
import Balance from './components/Balance'
import GestionAdmins from './components/GestionAdmins'
import BalanceHistorico from './components/BalanceHistorico'

export default function App() {
  const auth = useAuth()
  const { user, loading } = auth || {}

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>

  return (
    <>
      <Navbar />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        {!user ? (
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to="/tickets" replace />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/nuevo" element={<TicketForm onCreated={(id) => window.location.href = '/tickets/' + id} usuarioNombre={user?.email || 'Usuario'} />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/balance-historico" element={<BalanceHistorico />} />
            <Route path="/admins" element={<GestionAdmins />} />
            <Route path="/password" element={<PasswordChange />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<Navigate to="/tickets" replace />} />
          </>
        )}
      </Routes>
    </>
  )
}

function Logout() {
  const auth = useAuth()
  const { user } = auth || {}
  
  if (!user) return <Navigate to="/login" />
  
  return <Navigate to="/" />
}

function PasswordChange() {
  const [newPassword, setNewPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else { setSuccess(true); setNewPassword('') }
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Cambiar contraseña</h1></div>
      <div className="card" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {success && <p style={{ color: '#16a34a' }}>¡Contraseña cambiada!</p>}
          <div className="field">
            <label htmlFor="newPassword">Nueva contraseña</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <button type="submit" className="btn btn-primary">Cambiar contraseña</button>
        </form>
      </div>
    </div>
  )
}