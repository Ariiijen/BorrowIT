import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { AuthFrame } from '../components/AuthFrame'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isRecovery, setIsRecovery] = useState(() => window.location.hash.includes('type=recovery'))
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    const { error } = isRecovery
      ? await supabase.auth.updateUser({ password: newPassword })
      : await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/forgot-password` })
    setIsPending(false)
    if (error) toast.error(error.message)
    else if (isRecovery) {
      toast.success('Password updated. You can now log in.')
      await supabase.auth.signOut()
      window.location.assign('/login')
    } else toast.success('If an account exists for that email, a reset link is on its way.')
  }

  return (
    <AuthFrame title={isRecovery ? 'Choose a new password' : 'Reset your password'} subtitle={isRecovery ? 'Use a strong password you have not used here before.' : 'We’ll email you a secure link to choose a new password.'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRecovery ? <label className="block space-y-1.5"><span className="text-sm font-medium">New password</span><Input type="password" minLength={8} autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label> : <label className="block space-y-1.5"><span className="text-sm font-medium">Email</span><Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
        <Button type="submit" disabled={isPending || (isRecovery ? newPassword.length < 8 : !email)} className="w-full">{isPending ? 'Please wait...' : isRecovery ? 'Update password' : 'Send reset link'}</Button>
        <p className="text-center text-sm"><Link to="/login" className="font-semibold text-zinc-700 hover:text-pink-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-300 dark:hover:text-pink-300">Back to log in</Link></p>
      </form>
    </AuthFrame>
  )
}
