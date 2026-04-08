'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutos
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function SessionTimeout() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/login?timeout=1')
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(signOut, TIMEOUT_MS)
  }, [signOut])

  useEffect(() => {
    resetTimer()
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [resetTimer])

  return null
}
