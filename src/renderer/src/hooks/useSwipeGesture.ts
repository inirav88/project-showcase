import { useRef } from 'react'

export interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minDistance?: number
}

export function useSwipeGesture(options: SwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minDistance = 50,
  } = options

  const startCoord = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 1) {
      startCoord.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!startCoord.current || !e.changedTouches || e.changedTouches.length === 0) {
      return
    }

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startCoord.current.x
    const deltaY = endY - startCoord.current.y

    startCoord.current = null

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Check vertical swipe down (dismiss modal/lightbox)
    if (absY > absX && deltaY >= 80 && onSwipeDown) {
      onSwipeDown()
      return
    }

    // Check vertical swipe up
    if (absY > absX && deltaY <= -80 && onSwipeUp) {
      onSwipeUp()
      return
    }

    // Check horizontal swipe
    if (absX >= minDistance && absX > absY) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }

  return {
    onTouchStart,
    onTouchEnd,
  }
}
