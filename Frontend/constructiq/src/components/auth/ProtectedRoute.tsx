import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import type { UserRole } from '../../store/useAuthStore'

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
