import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useEmailRegister } from '../hooks/useEmailRegister'
import { emailRegisterSchema } from '../validators'
import { GoogleButton } from './GoogleButton'

type RegisterValues = z.infer<typeof emailRegisterSchema>

function passwordLevel(password: string) {
  if (password.length < 8) return 0
  const checks = [/[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)]
  return checks.filter(Boolean).length + 1
}

export function RegisterForm() {
  const navigate = useNavigate()
  const registerAccount = useEmailRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(emailRegisterSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', role: 'Borrower', studentNumber: '', employeeNumber: '', acceptedTerms: false },
  })
  const password = useWatch({ control: form.control, name: 'password' })
  const selectedRole = useWatch({ control: form.control, name: 'role' })
  const strength = passwordLevel(password)
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Strong', 'Strong'][strength]

  async function onSubmit(values: RegisterValues) {
    try {
      const result = await registerAccount.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
        studentNumber: values.studentNumber,
        employeeNumber: values.employeeNumber,
      })
      void result
      toast.success('Account created. Wait for admin activation before logging in.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create your account.')
    }
  }

  return (
    <div>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Account type</span>
          <select {...form.register('role')} className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950">
            <option value="Borrower">Borrower</option>
            <option value="Lender">Lender</option>
            <option value="Faculty">Faculty</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{selectedRole === 'Faculty' ? 'Employee number' : 'Student number'}</span>
          <Input
            {...form.register(selectedRole === 'Faculty' ? 'employeeNumber' : 'studentNumber')}
            required
          />
          {(selectedRole === 'Faculty'
            ? form.formState.errors.employeeNumber
            : form.formState.errors.studentNumber) && (
            <span className="block text-sm text-red-600">
              {selectedRole === 'Faculty'
                ? form.formState.errors.employeeNumber?.message
                : form.formState.errors.studentNumber?.message}
            </span>
          )}
        </label>
      </div>
      <GoogleButton
        label="Continue with Google"
        role={selectedRole}
        studentNumber={form.watch('studentNumber')}
        employeeNumber={form.watch('employeeNumber')}
      />
      <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />or sign up with email<span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <form className="grid gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-3 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Full name</span>
          <Input autoComplete="name" {...form.register('fullName')} />
          {form.formState.errors.fullName && <span className="block text-sm text-red-600">{form.formState.errors.fullName.message}</span>}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input type="email" autoComplete="email" placeholder="name@ustp.edu.ph" {...form.register('email')} />
          {form.formState.errors.email && <span className="block text-sm text-red-600">{form.formState.errors.email.message}</span>}
        </label>
        </div>
        <div className="space-y-3 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Password</span>
          <span className="relative block">
            <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="pr-11" {...form.register('password')} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 dark:hover:text-white">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          <span className="flex items-center gap-2" aria-live="polite">
            <span className="flex h-1.5 flex-1 gap-1">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-full flex-1 rounded-full ${strength >= step ? (strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-zinc-200 dark:bg-zinc-700'}`} />)}</span>
            <span className="text-xs text-zinc-500">{password ? strengthLabel : 'Use 8+ characters'}</span>
          </span>
          {form.formState.errors.password && <span className="block text-sm text-red-600">{form.formState.errors.password.message}</span>}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Confirm password</span>
          <span className="relative block">
            <Input type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" className="pr-11" {...form.register('confirmPassword')} />
            <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? 'Hide confirmation' : 'Show confirmation'} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500 dark:hover:text-white">
              {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {form.formState.errors.confirmPassword && <span className="block text-sm text-red-600">{form.formState.errors.confirmPassword.message}</span>}
        </label>
        </div>
        <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:col-span-2">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-pink-700 focus-visible:ring-2 focus-visible:ring-pink-500" {...form.register('acceptedTerms')} />
          <span>I agree to the <a href="#terms" className="underline underline-offset-2">Terms of Service</a> and <a href="#privacy" className="underline underline-offset-2">Privacy Policy</a>.</span>
        </label>
        {form.formState.errors.acceptedTerms && <span className="block text-sm text-red-600 sm:col-span-2">{form.formState.errors.acceptedTerms.message}</span>}
        <Button type="submit" disabled={registerAccount.isPending} className="w-full sm:col-span-2">
          {registerAccount.isPending && <LoaderCircle size={16} className="animate-spin" />}
          {registerAccount.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>Already have an account? <Link to="/login" className="rounded-sm font-semibold text-zinc-700 transition-colors hover:text-pink-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-zinc-300 dark:hover:text-pink-300">Log in</Link></p>
        <p><Link to="/admin/register" className="rounded-sm font-medium text-pink-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 dark:text-pink-300">Create the first administrator account</Link></p>
      </div>
    </div>
  )
}
