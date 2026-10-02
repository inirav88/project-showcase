import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePinchPanZoom } from '../usePinchPanZoom'

describe('usePinchPanZoom', () => {
  it('initializes at scale 1.0 with zero translation', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })

  it('increments scale on zoomIn() and clamps at maxScale', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 2.0 }))
    act(() => {
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(1.5)

    act(() => {
      result.current.zoomIn()
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(2.0)
  })

  it('decrements scale on zoomOut() and resets pan when returning to 1.0', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    act(() => {
      result.current.zoomIn()
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(2.0)

    act(() => {
      result.current.zoomOut()
      result.current.zoomOut()
    })
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })

  it('resets scale and pan cleanly on reset()', () => {
    const { result } = renderHook(() => usePinchPanZoom({ minScale: 1.0, maxScale: 3.5 }))
    act(() => {
      result.current.zoomIn()
    })
    expect(result.current.scale).toBe(1.5)

    act(() => {
      result.current.reset()
    })
    expect(result.current.scale).toBe(1.0)
    expect(result.current.pan).toEqual({ x: 0, y: 0 })
  })
})
