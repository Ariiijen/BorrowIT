import { useEffect, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { redirectByRole } from '@/features/auth/utils/redirectByRole'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { UserRole } from '@/types'

export function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: UserRole[]; children?: ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const roleDenied = !!profile && !!allowedRoles && !allowedRoles.includes(profile.role)

  useEffect(() => {
    if (roleDenied) toast.error('Your account does not have access to that page.')
  }, [roleDenied])

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!profile) return <div className="flex min-h-screen items-center justify-center px-5 text-sm text-zinc-600">Your profile could not be loaded. Please refresh or sign in again.</div>
  if (roleDenied) return <Navigate to={redirectByRole(profile.role)} replace />
  return children ?? <Outlet />
}
