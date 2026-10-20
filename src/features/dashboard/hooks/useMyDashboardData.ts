import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useMyDashboardData() {
  const { user, profile } = useAuth()
  return useQuery({
    queryKey: ['dashboard', user?.id, profile?.role],
    enabled: !!user && !!profile,
    queryFn: async () => {
      if (!user || !profile) return null
      const today = new Date().toISOString().slice(0, 10)

      if (profile.role === 'Borrower' || profile.role === 'Faculty') {
        const { data, error } = await supabase
          .from('borrowing_requests')
          .select('*')
          .eq('borrower_id', user.id)
          .order('requested_at', { ascending: false })
        if (error) throw error
        const requests = data ?? []
        return {
          activeBorrowings: requests.filter((row) => row.status === 'Borrowed'),
          pendingRequests: requests.filter((row) => row.status === 'Pending'),
          overdueItems: requests.filter((row) => row.status === 'Borrowed' && row.end_date < today),
          recentActivity: requests.slice(0, 5),
        }
      }

      if (profile.role === 'Lender') {
        const { data: listings, error: listingsError } = await supabase
          .from('equipment')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        if (listingsError) throw listingsError
        const equipmentIds = (listings ?? []).map((item) => item.id)
        const { data: requests, error: requestsError } = equipmentIds.length
          ? await supabase.from('borrowing_requests').select('*').in('equipment_id', equipmentIds).order('requested_at', { ascending: false })
          : { data: [], error: null }
        if (requestsError) throw requestsError
        const allRequests = requests ?? []
        const { data: lent, error: lentError } = await supabase.from('lending').select('*').eq('lender_id', user.id).order('created_at', { ascending: false })
        if (lentError) throw lentError
        return {
          myListings: listings ?? [],
          pendingApprovals: allRequests.filter((row) => row.status === 'Pending'),
          currentlyLent: (lent ?? []).filter((row) => row.status === 'Borrowed'),
          recentActivity: allRequests.slice(0, 5),
        }
      }

      const [equipmentCount, requests, disputes, userCount] = await Promise.all([
        supabase.from('equipment').select('id', { count: 'exact', head: true }),
        supabase.from('borrowing_requests').select('*').order('requested_at', { ascending: false }),
        supabase.from('dispute').select('id', { count: 'exact', head: true }).in('status', ['Open', 'UnderReview']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])
      for (const result of [equipmentCount, requests, disputes, userCount]) if (result.error) throw result.error
      return {
        totalEquipment: equipmentCount.count ?? 0,
        activeBorrowings: (requests.data ?? []).filter((row) => row.status === 'Borrowed'),
        pendingApprovals: (requests.data ?? []).filter((row) => row.status === 'Pending'),
        overdueItems: (requests.data ?? []).filter((row) => row.status === 'Borrowed' && row.end_date < today),
        openDisputes: disputes.count ?? 0,
        totalUsers: userCount.count ?? 0,
      }
    },
  })
}
