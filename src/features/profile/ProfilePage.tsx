import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuth } from '@/features/auth/hooks/useAuth'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-base font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  )
}

export function ProfilePage() {
  const { profile, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!profile) return <p className="text-zinc-500">Unable to load your profile.</p>

  const name = profile.full_name || profile.email
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const standing = profile.is_restricted
    ? profile.restriction_until
      ? `Restricted until ${new Date(profile.restriction_until).toLocaleDateString()}`
      : 'Restricted'
    : 'Good standing'

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your account</p>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Profile</h1>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-semibold text-zinc-900 dark:text-white">{name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.email}</p>
          <span className="mt-2 inline-block rounded-full border border-zinc-300 px-3 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            {profile.role}
          </span>
        </div>
      </div>

      <dl className="grid gap-6 rounded-2xl border border-zinc-200 p-6 sm:grid-cols-2 dark:border-zinc-800">
        {profile.student_number && <Field label="Student number" value={profile.student_number} />}
        {profile.employee_number && <Field label="Employee number" value={profile.employee_number} />}
        <Field label="Account standing" value={standing} />
        <Field label="Late returns" value={String(profile.late_return_count)} />
        <Field label="Member since" value={joined} />
      </dl>
    </div>
  )
}