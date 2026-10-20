import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function checkConnection() {
      try {
        const { error: connectionError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })

        if (!mounted) return

        if (connectionError) {
          setError(connectionError.message)
          setIsConnected(false)
          return
        }

        setIsConnected(true)
        setError(null)
      } catch (caughtError) {
        if (!mounted) return

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unknown connection error',
        )
        setIsConnected(false)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void checkConnection()

    return () => {
      mounted = false
    }
  }, [])

  return { isConnected, isLoading, error }
}
