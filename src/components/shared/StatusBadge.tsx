const statusTones: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  available: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  approved: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  completed: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  resolved: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  returned: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'in progress': 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  borrowed: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  'on loan': 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  cancelled: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  declined: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  damaged: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  overdue: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  rejected: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  restricted: 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300',
  unread: 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  unavailable: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

interface StatusBadgeProps {
  status: string
  neutral?: boolean
}

export function StatusBadge({ status, neutral = false }: StatusBadgeProps) {
  const tone = neutral
    ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
    : statusTones[status.trim().toLowerCase()] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  )
}
