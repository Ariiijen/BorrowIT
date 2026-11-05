import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { useGoogleLogin } from '../hooks/useGoogleLogin'

export function GoogleButton({
  label = 'Continue with Google',
  role,
  studentNumber,
  employeeNumber,
}: {
  label?: string
  role?: 'Borrower' | 'Lender' | 'Faculty'
  studentNumber?: string
  employeeNumber?: string
}) {
  const login = useGoogleLogin()

  async function handleClick() {
    try {
      await login.mutateAsync({ role, studentNumber, employeeNumber })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google sign-in could not start.')
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={login.isPending} onClick={handleClick}>
      <span aria-hidden="true" className="font-bold text-base">G</span>
      {login.isPending ? 'Connecting...' : label}
    </Button>
  )
}
