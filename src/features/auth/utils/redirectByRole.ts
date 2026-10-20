import type { UserRole } from '@/types'

export function redirectByRole(role: UserRole | null | undefined) {
  if (role === 'Admin') return '/admin/dashboard'
  if (role === 'Lender') return '/lender/dashboard'
  return '/dashboard'
}
