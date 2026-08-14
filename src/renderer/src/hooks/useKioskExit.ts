import { useRef, useCallback } from 'react'

interface Options {
  onExit: () => void
  holdMs?: number
}

export function useKioskExit({ onExit, holdMs = 5000 }: Options): {
  startHold: () => void
  endHold: () => void
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startHold = useCallback(() => {
    timerRef.current = setTimeout(onExit, holdMs)
  }, [onExit, holdMs])

  const endHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { startHold, endHold }
}
