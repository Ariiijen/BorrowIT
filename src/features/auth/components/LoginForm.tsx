import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useEmailLogin } from '../hooks/useEmailLogin'
import { emailLoginSchema } from '../validators'
import { redirectByRole } from '../utils/redirectByRole'
import { GoogleButton } from './GoogleButton'

type LoginValues = z.infer<typeof emailLoginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const login = useEmailLogin()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const form = useForm<LoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: localStorage.getItem('borrowit-remembered-email') ?? '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    try {
      const result = await login.mutateAsync(values)
      if (rememberMe) localStorage.setItem('borrowit-remembered-email', values.email)
      else localStorage.removeItem('borrowit-remembered-email')
      toast.success('Welcome back.')
      navigate(redirectByRole(result.role), { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to log in.')
    }
  }

  return (
    <div>
      <GoogleButton />
      <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or continue with email
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <form className="space-y-3.5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input type="email" autoComplete="email" placeholder="name@ustp.edu.ph" {...form.register('email')} />
          {form.formState.errors.email && <span className="block text-sm text-red-600">{form.formState.errors.email.message}</span>}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Password</span>
          <span className="relative block">
            <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-11" {...form.register('password')} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 dark:hover:text-white">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {form.formState.errors.password && <span className="block text-sm text-red-600">{form.formState.errors.password.message}</span>}
        </label>
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 accent-pink-700 focus-visible:ring-2 focus-visible:ring-pink-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="rounded-sm font-medium text-zinc-600 transition-colors hover:text-pink-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-400 dark:hover:text-pink-300">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending && <LoaderCircle size={16} className="animate-spin" />}
          {login.isPending ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
      <p className="mt-4 border-t border-zinc-100 pt-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        Don&apos;t have an account? <Link to="/register" className="rounded-sm font-semibold text-zinc-800 transition-colors hover:text-pink-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-200 dark:hover:text-pink-300">Sign up</Link>
      </p>
    </div>
  )
}
