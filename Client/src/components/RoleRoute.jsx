import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/authContext.js'
import { getHomePath } from '../utils/routes'

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth()
  if (!user?.role || !roles.includes(user.role)) {
    return <Navigate to={getHomePath(user?.role)} replace />
  }
  return children
}