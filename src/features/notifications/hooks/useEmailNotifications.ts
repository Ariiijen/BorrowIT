import { useEffect, useRef } from 'react'
import { send } from '@emailjs/browser'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useEmailNotifications() {
  const { user } = useAuth()
  const sending = useRef(false)

  useEffect(() => {
    if (!user) return
    const userId = user.id

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    if (!serviceId || !templateId || !publicKey) return

    async function processPendingEmails(recipientEmail?: string, notificationId?: string) {
      if (sending.current) return
      sending.current = true
      try {
        let deliveriesQuery = supabase
          .from('notification_delivery')
          .select('id, notification_id, email, attempts')
          .eq('status', 'Pending')
          .lt('attempts', 5)
          .limit(20)

        if (notificationId) {
          deliveriesQuery = deliveriesQuery.eq('notification_id', notificationId)
        } else if (recipientEmail) {
          deliveriesQuery = deliveriesQuery.eq('email', recipientEmail.toLowerCase())
        } else {
          const { data: ownNotifications, error: ownNotificationsError } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
          if (ownNotificationsError) throw ownNotificationsError

          const notificationIds = (ownNotifications ?? []).map((notification) => notification.id)
          if (notificationIds.length === 0) return
          deliveriesQuery = deliveriesQuery.in('notification_id', notificationIds)
        }

        const { data: deliveries, error } = await deliveriesQuery
        if (error) throw error

        for (const delivery of deliveries ?? []) {
          const { data: notification, error: notificationError } = await supabase
            .from('notifications')
            .select('type, message')
            .eq('id', delivery.notification_id)
            .single()
          if (notificationError || !notification) continue

          try {
            await send(serviceId, templateId, {
              to_email: delivery.email,
              notification_type: notification.type,
              message: notification.message,
              workspace_url: `${window.location.origin}/notifications`,
              name: 'BorrowIT',
            }, { publicKey })
            const { error: updateError } = await supabase.from('notification_delivery').update({
              status: 'Sent',
              attempts: delivery.attempts + 1,
              last_attempt_at: new Date().toISOString(),
            }).eq('id', delivery.id)
            if (updateError) throw updateError
          } catch (error) {
            await supabase.from('notification_delivery').update({
              status: delivery.attempts + 1 >= 5 ? 'Failed' : 'Pending',
              attempts: delivery.attempts + 1,
              last_attempt_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : String(error),
            }).eq('id', delivery.id)
          }
        }
      } finally {
        sending.current = false
      }
    }

    void processPendingEmails()
    const intervalId = window.setInterval(() => void processPendingEmails(), 60_000)
    const handlePendingDelivery = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string; notificationId?: string }>).detail
      void processPendingEmails(detail?.email, detail?.notificationId)
    }
    window.addEventListener('borrowit:pending-email', handlePendingDelivery)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('borrowit:pending-email', handlePendingDelivery)
    }
  }, [user?.id])
}
