import { useEffect, useRef } from 'react'

/**
 * Calls `onIdle` after `timeoutMs` of no mouse/keyboard/touch activity.
 * Calls `onActive` when activity resumes.
 */
export function useIdleTimer(timeoutMs: number, onIdle: () => void, onActive: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isIdleRef = useRef(false)

  useEffect(() => {
    if (timeoutMs <= 0) return

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (isIdleRef.current) {
        isIdleRef.current = false
        onActive()
      }
      timerRef.current = setTimeout(() => {
        isIdleRef.current = true
        onIdle()
      }, timeoutMs)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [timeoutMs, onIdle, onActive])
}
