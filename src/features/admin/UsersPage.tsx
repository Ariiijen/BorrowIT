import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { supabase } from '@/lib/supabase'

export function UsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const changeRole = useMutation({
    mutationFn: async ({ profileId, role }: { profileId: string; role: 'Borrower' | 'Lender' | 'Faculty' | 'Admin' }) => {
      const { error: updateError } = await supabase.from('profiles').update({ role }).eq('id', profileId)
      if (updateError) throw updateError
    },
    onSuccess: async () => {
      queryClient.clear()
      toast.success('Role updated. User data caches were cleared.')
      if (user) await queryClient.invalidateQueries({ queryKey: ['admin', 'users', user.id] })
    },
    onError: (updateError: Error) => toast.error(updateError.message),
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: users, error: queryError } = await supabase.from('profiles').select('id, full_name, email, role, is_restricted').order('created_at', { ascending: false })
      if (queryError) throw queryError
      return users
    },
  })
  return <div className="space-y-8"><PageHeader eyebrow="Administration" title="Manage users" description="Admin accounts cannot be assigned through public registration." />{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load users: {error.message}</p>}{changeRole.error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not update role: {changeRole.error.message}</p>}<div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">{isLoading ? <div className="space-y-4 p-5">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-8 w-full" />)}</div> : <table className="min-w-full text-left text-sm"><thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Access</th></tr></thead><tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{data?.map((item) => <tr key={item.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="px-4 py-3 font-medium">{item.full_name || '—'}</td><td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.email}</td><td className="px-4 py-3"><select aria-label={`Role for ${item.full_name || item.email}`} disabled={item.id === user?.id || changeRole.isPending} value={item.role} onChange={(event) => changeRole.mutate({ profileId: item.id, role: event.target.value as 'Borrower' | 'Lender' | 'Faculty' | 'Admin' })} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:ring-offset-zinc-950"><option value="Borrower">Borrower</option><option value="Lender">Lender</option><option value="Faculty">Faculty</option><option value="Admin">Admin</option></select></td><td className="px-4 py-3"><StatusBadge status={item.is_restricted ? 'Restricted' : 'Active'} /></td></tr>)}</tbody></table>}</div></div>
}
