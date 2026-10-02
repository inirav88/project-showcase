import { useState, useRef, useCallback } from 'react'

export interface PinchPanOptions {
  minScale?: number
  maxScale?: number
}

export function usePinchPanZoom(options: PinchPanOptions = {}) {
  const { minScale = 1.0, maxScale = 3.5 } = options

  const [scale, setScale] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const initialDistance = useRef<number | null>(null)
  const initialScale = useRef<number>(1.0)
  const lastTouchMidpoint = useRef<{ x: number; y: number } | null>(null)

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(1)), maxScale))
  }, [maxScale])

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), minScale)
      if (next <= 1.0) {
        setPan({ x: 0, y: 0 })
      }
      return next
    })
  }, [minScale])

  const reset = useCallback(() => {
    setScale(1.0)
    setPan({ x: 0, y: 0 })
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      initialDistance.current = dist
      initialScale.current = scale
      lastTouchMidpoint.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 2 && initialDistance.current !== null) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const ratio = currentDist / initialDistance.current
      const newScale = Math.min(Math.max(initialScale.current * ratio, minScale), maxScale)

      setScale(Number(newScale.toFixed(2)))

      // Two-finger pan
      const currentMidpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }

      if (lastTouchMidpoint.current) {
        const dx = currentMidpoint.x - lastTouchMidpoint.current.x
        const dy = currentMidpoint.y - lastTouchMidpoint.current.y
        setPan((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }))
      }
      lastTouchMidpoint.current = currentMidpoint
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length < 2) {
      initialDistance.current = null
      lastTouchMidpoint.current = null
      if (scale <= 1.05) {
        reset()
      }
    }
  }

  return {
    scale,
    pan,
    zoomIn,
    zoomOut,
    reset,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    transformStyle: {
      transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
      transformOrigin: 'center center',
      transition: initialDistance.current ? 'none' : 'transform 0.15s ease-out',
    },
  }
}
