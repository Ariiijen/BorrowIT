import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useMyNotifications } from './hooks/useMyNotifications'
import { supabase } from '@/lib/supabase'

export function NotificationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useMyNotifications()
  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('Sign in to update notifications.')
      const { error: updateError } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', user.id)
      if (updateError) throw updateError
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'mine', user?.id] }),
  })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Your account" title="Notifications" description="Request updates and reminders addressed to you." />
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load notifications: {error.message}</p>}
      <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {isLoading ? <div className="space-y-5 py-5">{[0, 1, 2].map((row) => <div key={row} className="flex items-center gap-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="mt-2 h-3 w-32" /></div></div>)}</div> : data?.length ? data.map((item) => <article key={item.id} className="flex items-start gap-4 rounded-xl px-3 py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/70">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.is_read ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}><Bell size={16} /></span>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm text-zinc-800 dark:text-zinc-200">{item.message}</p><StatusBadge status={item.is_read ? 'Read' : 'Unread'} /></div><p className="mt-1 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</p></div>
          {!item.is_read && <button type="button" disabled={markRead.isPending} aria-label="Mark as read" title="Mark as read" onClick={() => markRead.mutate(item.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"><Check size={17} /></button>}
        </article>) : <div className="py-12 text-center"><Bell size={22} className="mx-auto text-zinc-400" /><p className="mt-3 text-sm text-zinc-500">No notifications yet.</p></div>}
      </div>
      {markRead.error && <p className="text-sm text-red-600">Could not update notification: {markRead.error.message}</p>}
    </div>
  )
}
