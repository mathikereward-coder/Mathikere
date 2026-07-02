import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import FieldForm from './pages/FieldForm'
import Dashboard from './pages/Dashboard'
import Households from './pages/Households'
import FieldTeam from './pages/FieldTeam'
import AddPerson from './pages/AddPerson'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/new" element={<FieldForm />} />
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
            <Route path="/households" element={<Households />} />
            <Route path="/team" element={<ProtectedRoute adminOnly><FieldTeam /></ProtectedRoute>} />
            <Route path="/team/add/:kind" element={<ProtectedRoute adminOnly><AddPerson /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/new" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
