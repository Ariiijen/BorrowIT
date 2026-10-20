import type { ReactNode } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { UserRole } from '@/types'

export function RoleGuard({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile || !allow.includes(profile.role)) return null
  return children
}
