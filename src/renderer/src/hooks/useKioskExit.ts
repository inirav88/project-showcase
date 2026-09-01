import { useRef, useCallback, useState } from 'react'

interface Options {
  onExit: () => void
  holdMs?: number
}

export function useKioskExit({ onExit, holdMs = 3000 }: Options): {
  startHold: () => void
  endHold: () => void
  isHolding: boolean
  progress: number
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isHolding, setIsHolding] = useState(false)
  const [progress, setProgress] = useState(0)

  const startHold = useCallback(() => {
    setIsHolding(true)
    setProgress(0)

    const startTime = Date.now()

    // Update progress every 50ms
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min((elapsed / holdMs) * 100, 100)
      setProgress(currentProgress)
    }, 50)

    timerRef.current = setTimeout(() => {
      setIsHolding(false)
      setProgress(0)
      onExit()
    }, holdMs)
  }, [onExit, holdMs])

  const endHold = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsHolding(false)
    setProgress(0)
  }, [])

  return { startHold, endHold, isHolding, progress }
}
