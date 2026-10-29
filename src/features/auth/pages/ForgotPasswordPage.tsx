import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { friendlyAuthError } from '@/features/auth/lib/authHelpers'
import { auth } from '@/lib/firebase'
import { AuthFrame } from '../components/AuthFrame'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      toast.success('If an account exists for that email, a reset link is on its way.')
    } catch (error) {
      toast.error(friendlyAuthError(error).message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AuthFrame
      title="Reset your password"
      subtitle="We’ll email you a secure link to choose a new password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={isPending || !email} className="w-full">
          {isPending ? 'Please wait...' : 'Send reset link'}
        </Button>
        <p className="text-center text-sm">
          <Link
            to="/login"
            className="font-semibold text-zinc-700 hover:text-pink-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-300 dark:hover:text-pink-300"
          >
            Back to log in
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}