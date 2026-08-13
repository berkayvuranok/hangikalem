import { useAuthStore } from '@/stores/authStore'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function ProtectedRoute({
  children,
  admin,
}: {
  children: ReactNode
  admin?: boolean
}) {
  const user = useAuthStore((s) => s.user)
  const loc = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }
  if (admin && user.role !== 'admin') {
    return <Navigate to="/profile" replace />
  }
  return children
}
