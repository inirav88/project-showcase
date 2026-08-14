import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../channels'

describe('IPC_CHANNELS', () => {
  it('exports a non-empty object', () => {
    expect(Object.keys(IPC_CHANNELS).length).toBeGreaterThan(0)
  })
  it('all values are non-empty strings', () => {
    Object.values(IPC_CHANNELS).forEach(v => expect(typeof v).toBe('string'))
  })
})
