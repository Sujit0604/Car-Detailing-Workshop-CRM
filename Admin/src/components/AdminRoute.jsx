import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext.js";

export default function AdminRoute({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}