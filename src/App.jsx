import { Routes, Route } from 'react-router-dom'
import AdminApp from './AdminApp'
import PublicStatus from './components/PublicStatus'
import ActualizarPassword from './components/ActualizarPassword'
import BalanceHistorico from './components/BalanceHistorico'

export default function App() {
  return (
    <Routes>
      {/* Página pública: no requiere login, la ve el cliente al escanear el QR */}
      <Route path="/estado/:codigo" element={<PublicStatus />} />

      {/* A donde llegan los enlaces de invitación y de recuperación de contraseña */}
      <Route path="/actualizar-password" element={<ActualizarPassword />} />

      {/* Todo lo demás es el panel administrativo, protegido con login */}
      <Route path="/*" element={<AdminApp />} />

      {/* Ruta al balance historico de la app */}
      <Route path="/balance-historico" element={<BalanceHistorico />} />
    </Routes>
  )
}
