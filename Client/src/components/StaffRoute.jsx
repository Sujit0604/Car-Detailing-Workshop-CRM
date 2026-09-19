import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";

export default function StaffRoute({ children }) {
  const { user } = useAuth()
  if (!user?.role || user.role === 'CUSTOMER') return <Navigate to="/dashboard" replace />
  return children
}