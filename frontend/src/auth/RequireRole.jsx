import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export default function RequireRole({ role, children }) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user?.role !== role) return <Navigate to="/" replace />
  return children
}
