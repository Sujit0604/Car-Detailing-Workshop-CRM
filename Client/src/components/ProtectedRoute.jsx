import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/authContext.js'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}