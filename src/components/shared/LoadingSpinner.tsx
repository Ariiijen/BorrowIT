import { LoaderCircle } from 'lucide-react'

export function LoadingSpinner({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300" role="status" aria-live="polite">
      <span className="flex items-center gap-3 text-sm"><LoaderCircle size={18} className="animate-spin text-pink-700 dark:text-pink-400" />{label}</span>
    </div>
  )
}
