import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import TicketList from './components/TicketList'
import TicketForm from './components/TicketForm'
import TicketDetail from './components/TicketDetail'
import Balance from './components/Balance'
import GestionAdmins from './components/GestionAdmins'
import BalanceHistorico from './components/BalanceHistorico'

export default function AdminApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    checkSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/tickets" />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/nuevo" element={<TicketForm onCreated={(id) => window.location.href = '/tickets/' + id} usuarioNombre={user.email} />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/balance-historico" element={<BalanceHistorico />} />
        <Route path="/admins" element={<GestionAdmins />} />
        <Route path="/password" element={<PasswordChange />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<Navigate to="/tickets" />} />
      </Routes>
    </BrowserRouter>
  )
}

function Logout() {
  useEffect(() => {
    async function logout() {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    logout()
  }, [])
  return <div>Cerrando sesión...</div>
}

function PasswordChange() {
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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