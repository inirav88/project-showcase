import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateNotificationBanner, UpdaterState } from '../UpdateNotificationBanner'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

describe('UpdateNotificationBanner', () => {
  let mockListeners: Record<string, Function[]> = {}
  let currentStatus: UpdaterState

  beforeEach(() => {
    mockListeners = {}
    currentStatus = {
      status: 'IDLE',
      currentVersion: '0.0.10',
      updateInfo: null,
      downloadProgress: null,
      error: null,
      lastCheckedAt: null
    }

    ;(window as any).api = {
      invoke: vi.fn(async (channel: string) => {
        if (channel === IPC_CHANNELS.UPDATER_GET_STATUS) {
          return currentStatus
        }
        if (channel === IPC_CHANNELS.UPDATER_QUIT_AND_INSTALL) {
          return { success: true }
        }
        return null
      }),
      on: vi.fn((channel: string, callback: Function) => {
        if (!mockListeners[channel]) mockListeners[channel] = []
        mockListeners[channel].push(callback)
        return () => {
          mockListeners[channel] = mockListeners[channel].filter((cb) => cb !== callback)
        }
      })
    }
  })

  it('does NOT render when status is IDLE, CHECKING, or NOT_AVAILABLE', async () => {
    const { container } = render(<UpdateNotificationBanner />)
    await act(async () => {})
    expect(container.firstChild).toBeNull()
  })

  it('does NOT render on network/offline errors (e.g. net::ERR_NAME_NOT_RESOLVED)', async () => {
    currentStatus = {
      status: 'ERROR',
      currentVersion: '0.0.10',
      updateInfo: null,
      downloadProgress: null,
      error: 'net::ERR_NAME_NOT_RESOLVED',
      lastCheckedAt: new Date().toISOString()
    }

    const { container } = render(<UpdateNotificationBanner />)
    await act(async () => {})

    // The banner must remain suppressed so offline kiosk displays remain clean
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText(/Update Warning/i)).toBeNull()
  })

  it('renders software update available notice when status is AVAILABLE', async () => {
    currentStatus = {
      status: 'AVAILABLE',
      currentVersion: '0.0.10',
      updateInfo: { version: '0.0.11' },
      downloadProgress: null,
      error: null,
      lastCheckedAt: new Date().toISOString()
    }

    render(<UpdateNotificationBanner />)
    await act(async () => {})

    expect(screen.getByText(/Software Update Available:/i)).toBeDefined()
    expect(screen.getByText(/v0.0.11/i)).toBeDefined()
  })

  it('renders downloading state with progress bar when status is DOWNLOADING', async () => {
    currentStatus = {
      status: 'DOWNLOADING',
      currentVersion: '0.0.10',
      updateInfo: { version: '0.0.11' },
      downloadProgress: {
        percent: 65,
        bytesPerSecond: 1048576,
        transferred: 65000000,
        total: 100000000
      },
      error: null,
      lastCheckedAt: new Date().toISOString()
    }

    render(<UpdateNotificationBanner />)
    await act(async () => {})

    expect(screen.getByText(/Downloading Update v0.0.11:/i)).toBeDefined()
  })

  it('renders update ready state with Restart button when status is DOWNLOADED', async () => {
    currentStatus = {
      status: 'DOWNLOADED',
      currentVersion: '0.0.10',
      updateInfo: { version: '0.0.11' },
      downloadProgress: null,
      error: null,
      lastCheckedAt: new Date().toISOString()
    }

    render(<UpdateNotificationBanner />)
    await act(async () => {})

    expect(screen.getByText(/Update Ready:/i)).toBeDefined()
    expect(screen.getByText(/Restart & Install Now/i)).toBeDefined()
  })
})
