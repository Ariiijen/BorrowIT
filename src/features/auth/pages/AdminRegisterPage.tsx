import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import { friendlyAuthError } from '../lib/authHelpers'
import { AuthFrame } from '../components/AuthFrame'

export function AdminRegisterPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsPending(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(user, { displayName: fullName.trim() })

      const { error } = await supabase.rpc('bootstrap_first_admin', {
        p_email: email.trim(),
        p_full_name: fullName.trim(),
      })
      if (error) throw error

      await signOut(auth)
      toast.success('Administrator account created and authenticated.')
      navigate('/login', { replace: true })
    } catch (error) {
      if (auth.currentUser) await signOut(auth)
      toast.error(friendlyAuthError(error).message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AuthFrame title="Create administrator account" subtitle="Available only until the first administrator is created.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1.5 text-sm font-medium">
          Full name
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} required autoComplete="name" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Confirm password
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
        </label>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <LoaderCircle size={16} className="animate-spin" />}
          {isPending ? 'Creating administrator...' : 'Create administrator account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link to="/login" className="font-semibold underline underline-offset-2">Back to login</Link>
      </p>
    </AuthFrame>
  )
}
