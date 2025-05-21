import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UserInfo from './pages/UserInfo'
import NotFound from './pages/NotFound'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  const { checkAuth } = useAuth()
  const location = useLocation()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="user-info" element={<UserInfo />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App