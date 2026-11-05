import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, RotateCcw, ShieldX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UserRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'email' | 'full_name' | 'role' | 'student_number' | 'employee_number' |
  'contact_number' | 'is_restricted' | 'is_activated' | 'activation_status' |
  'activated_at' | 'activated_by' | 'rejection_reason' | 'created_at' | 'updated_at'
>

export function UsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All')
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
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
  const reviewAccount = useMutation({
    mutationFn: async ({ profile, action }: { profile: UserRow; action: 'Approve' | 'Reject' }) => {
      const isApproved = action === 'Approve'
      const reason = isApproved
        ? null
        : rejectionReason.trim() || null
      const { error } = await supabase.rpc('review_user_account', {
        p_profile_id: profile.id,
        p_action: action,
        p_reason: reason,
      })
      if (error) throw error
      return { action, profile }
    },
    onSuccess: async ({ action, profile }) => {
      toast.success(`Account ${action === 'Approve' ? 'activated' : 'rejected'} successfully.`)
      const expectedType = action === 'Approve' ? 'AccountApproved' : 'AccountRejected'
      const { data: accountNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', expectedType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      window.dispatchEvent(new CustomEvent('borrowit:pending-email', {
        detail: {
          email: profile.email,
          notificationId: accountNotification?.id,
        },
      }))
      setRejecting(false)
      setRejectionReason('')
      setSelected(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', user?.id] })
    },
    onError: (reviewError: Error) => toast.error(reviewError.message),
  })

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !reviewAccount.isPending) {
        setRejecting(false)
        setSelected(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [reviewAccount.isPending])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: users, error: queryError } = await supabase.rpc(
        'list_profiles_for_admin',
      )
      if (queryError?.code === 'PGRST202') {
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, student_number, employee_number, contact_number, is_restricted, is_activated, activation_status, activated_at, activated_by, rejection_reason, created_at, updated_at')
          .order('created_at', { ascending: false })
        if (fallbackError) throw new Error(
          `${fallbackError.message} Run the latest Supabase migration so the admin profile RPC is available.`,
        )
        return fallbackUsers as UserRow[]
      }
      if (queryError) throw queryError
      return users as UserRow[] | null
    },
  })
  const filteredUsers = data?.filter((item) => filter === 'All' || item.activation_status === filter) ?? []
  const pendingCount = data?.filter((item) => item.activation_status === 'Pending').length ?? 0

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Manage users" description="Review registration details before approving account access." />

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load users: {error.message}</p>}
      {changeRole.error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not update role: {changeRole.error.message}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((option) => (
          <button key={option} type="button" onClick={() => setFilter(option)} className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${filter === option ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'}`}>
            {option}{option === 'Pending' ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="space-y-4 p-5">{[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-8 w-full" />)}</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Activation</th><th className="px-4 py-3 font-medium">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium">{item.full_name || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.email}</td>
                  <td className="px-4 py-3">
                    <select aria-label={`Role for ${item.full_name || item.email}`} disabled={item.id === user?.id || changeRole.isPending} value={item.role} onChange={(event) => changeRole.mutate({ profileId: item.id, role: event.target.value as 'Borrower' | 'Lender' | 'Faculty' | 'Admin' })} className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-pink-500 dark:border-zinc-700 dark:bg-zinc-950">
                      <option value="Borrower">Borrower</option><option value="Lender">Lender</option><option value="Faculty">Faculty</option><option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.activation_status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className="h-9 px-3" onClick={() => { setRejecting(false); setRejectionReason(''); setSelected(item) }}><Eye size={15} />Details</Button>
                      {item.activation_status === 'Pending' && <Button type="button" className="h-9 px-3" disabled={reviewAccount.isPending} onClick={() => reviewAccount.mutate({ profile: item, action: 'Approve' })}><CheckCircle2 size={15} />Activate</Button>}
                      {item.activation_status === 'Rejected' && <Button type="button" variant="outline" className="h-9 px-3" disabled={reviewAccount.isPending} onClick={() => reviewAccount.mutate({ profile: item, action: 'Approve' })}><RotateCcw size={15} />Re-activate</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`User details for ${selected.full_name}`} onMouseDown={(event) => { if (event.target === event.currentTarget && !reviewAccount.isPending) { setRejecting(false); setSelected(null) } }}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Registration review</p><h2 className="mt-1 text-xl font-semibold">{selected.full_name || 'Unnamed user'}</h2></div>
              <button type="button" aria-label="Close details" onClick={() => { setRejecting(false); setSelected(null) }} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18} /></button>
            </div>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-zinc-500">Email</dt><dd className="mt-1 break-all font-medium">{selected.email}</dd></div>
              <div><dt className="text-zinc-500">Requested role</dt><dd className="mt-1 font-medium">{selected.role}</dd></div>
              <div><dt className="text-zinc-500">Student number</dt><dd className="mt-1 font-medium">{selected.student_number || 'Not provided'}</dd></div>
              <div><dt className="text-zinc-500">Employee number</dt><dd className="mt-1 font-medium">{selected.employee_number || 'Not provided'}</dd></div>
              <div><dt className="text-zinc-500">Contact number</dt><dd className="mt-1 font-medium">{selected.contact_number || 'Not provided'}</dd></div>
              <div><dt className="text-zinc-500">Registered</dt><dd className="mt-1 font-medium">{new Date(selected.created_at).toLocaleString()}</dd></div>
            </dl>
            {selected.activation_status === 'Rejected' && selected.rejection_reason && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">Rejection reason: {selected.rejection_reason}</p>}
            {rejecting && (
              <div className="mt-5">
                <label htmlFor="rejection-reason" className="text-sm font-medium">Reason for rejection</label>
                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Explain what information needs to be corrected (optional)"
                />
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {selected.activation_status === 'Pending' && !rejecting && <Button type="button" variant="outline" disabled={reviewAccount.isPending} onClick={() => setRejecting(true)}><ShieldX size={16} />Reject</Button>}
              {selected.activation_status === 'Pending' && rejecting && (
                <>
                  <Button type="button" variant="outline" disabled={reviewAccount.isPending} onClick={() => { setRejecting(false); setRejectionReason('') }}>Cancel</Button>
                  <Button type="button" variant="outline" className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40" disabled={reviewAccount.isPending} onClick={() => reviewAccount.mutate({ profile: selected, action: 'Reject' })}><ShieldX size={16} />Confirm rejection</Button>
                </>
              )}
              {selected.activation_status !== 'Approved' && <Button type="button" disabled={reviewAccount.isPending} onClick={() => reviewAccount.mutate({ profile: selected, action: 'Approve' })}><CheckCircle2 size={16} />Activate account</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
