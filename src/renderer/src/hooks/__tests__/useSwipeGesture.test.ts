import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeGesture } from '../useSwipeGesture'

describe('useSwipeGesture', () => {
  it('triggers onSwipeLeft when user swipes horizontally left > 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 200, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 105 }],
      } as any)
    })

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('triggers onSwipeRight when user swipes horizontally right > 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 180, clientY: 95 }],
      } as any)
    })

    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('triggers onSwipeDown when user swipes down > 80px', () => {
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeDown })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 105, clientY: 210 }],
      } as any)
    })

    expect(onSwipeDown).toHaveBeenCalledTimes(1)
  })

  it('ignores minor jitter movements < 50px', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({ onSwipeLeft, onSwipeRight })
    )

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as any)
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 105 }],
      } as any)
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})
