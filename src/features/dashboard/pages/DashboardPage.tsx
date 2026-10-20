import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { BorrowerDashboard } from './BorrowerDashboard'
import { LenderDashboard } from './LenderDashboard'
import { AdminDashboard } from './AdminDashboard'

export function DashboardPage() {
  const { profile } = useAuth()
  if (!profile) return <p className="text-sm text-zinc-500">Your profile is not available.</p>
  if (profile.role === 'Borrower' || profile.role === 'Faculty') return <BorrowerDashboard />
  if (profile.role === 'Lender') return <LenderDashboard />
  if (profile.role === 'Admin') return <AdminDashboard />
  return <Navigate to="/login" replace />
}
