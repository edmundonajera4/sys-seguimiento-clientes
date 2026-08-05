import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import Navbar from './components/Navbar'
import TicketList from './components/TicketList'
import TicketForm from './components/TicketForm'
import TicketDetail from './components/TicketDetail'
import Balance from './components/Balance'
import GestionAdmins from './components/GestionAdmins'
import Balance from './components/Balance'
import BalanceHistorico from './components/BalanceHistorico'

export default function AdminApp() {
  const [session, setSession] = useState(undefined) // undefined = cargando, null = sin sesión
  const [usuarioNombre, setUsuarioNombre] = useState('')
  const [usuarioRol, setUsuarioRol] = useState('')
  const [view, setView] = useState('lista') // lista | nuevo | detalle | balance | admins
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) {
      supabase
        .from('usuarios')
        .select('nombre, rol')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          setUsuarioNombre(data?.nombre || session.user.email)
          setUsuarioRol(data?.rol || '')
        })
    }
  }, [session])

  function irADetalle(id) {
    setTicketSeleccionado(id)
    setView('detalle')
  }

  if (session === undefined) {
    return <div className="page"><p className="text-muted">Cargando...</p></div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <Navbar view={view} setView={setView} usuarioNombre={usuarioNombre} usuarioRol={usuarioRol} />

      {view === 'lista' && <TicketList onSelectTicket={irADetalle} />}
      {view === 'nuevo' && <TicketForm onCreated={irADetalle} usuarioNombre={usuarioNombre} />}
      {view === 'detalle' && (
        <TicketDetail ticketId={ticketSeleccionado} onBack={() => setView('lista')} />
      )}
      {view === 'balance' && <Balance />}
      {view === 'admins' && usuarioRol === 'admin' && <GestionAdmins />}
    </div>
  )
}
