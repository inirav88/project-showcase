import React, { useEffect, useState } from 'react'
import { IPC_CHANNELS } from '../../../main/ipc/channels'

export interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdaterState {
  status:
    | 'IDLE'
    | 'CHECKING'
    | 'AVAILABLE'
    | 'NOT_AVAILABLE'
    | 'DOWNLOADING'
    | 'DOWNLOADED'
    | 'ERROR'
  currentVersion: string
  updateInfo: { version: string; releaseNotes?: string } | null
  downloadProgress: DownloadProgress | null
  error: string | null
  lastCheckedAt: string | null
}

export const UpdateNotificationBanner: React.FC = () => {
  const [updaterState, setUpdaterState] = useState<UpdaterState | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Fetch initial state safely
    if (window.api?.invoke) {
      window.api
        .invoke(IPC_CHANNELS.UPDATER_GET_STATUS)
        .then((res) => {
          if (res) setUpdaterState(res as UpdaterState)
        })
        .catch((err) => console.error('Failed to get updater status:', err))
    }

    let unsubscribeStatus: any = null
    let unsubscribeProgress: any = null

    if (window.api?.on) {
      try {
        unsubscribeStatus = window.api.on(
          IPC_CHANNELS.UPDATER_STATUS_CHANGED,
          (data) => {
            if (data) setUpdaterState(data as UpdaterState)
            setDismissed(false)
          }
        )
      } catch (e) {
        console.warn('Failed to subscribe to status changed:', e)
      }

      try {
        unsubscribeProgress = window.api.on(
          IPC_CHANNELS.UPDATER_DOWNLOAD_PROGRESS,
          (progData) => {
            if (progData) setProgress(progData as DownloadProgress)
          }
        )
      } catch (e) {
        console.warn('Failed to subscribe to download progress:', e)
      }
    }

    return () => {
      if (typeof unsubscribeStatus === 'function') unsubscribeStatus()
      if (typeof unsubscribeProgress === 'function') unsubscribeProgress()
    }
  }, [])

  if (dismissed || !updaterState) return null

  const { status, updateInfo, error } = updaterState

  // Only show banner if there's actionable or active update state
  if (
    status === 'IDLE' ||
    status === 'CHECKING' ||
    status === 'NOT_AVAILABLE'
  ) {
    return null
  }

  const handleQuitAndInstall = () => {
    window.api.invoke(IPC_CHANNELS.UPDATER_QUIT_AND_INSTALL)
  }

  const formatMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1)

  return (
    <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white shadow-lg border-b border-amber-500/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm z-50 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>

        {status === 'AVAILABLE' && (
          <div>
            <span className="font-semibold">Software Update Available:</span> Version{' '}
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">
              v{updateInfo?.version || 'New'}
            </span>{' '}
            is downloading in the background...
          </div>
        )}

        {status === 'DOWNLOADING' && (
          <div className="flex items-center gap-3">
            <div>
              <span className="font-semibold">Downloading Update v{updateInfo?.version}:</span>{' '}
              {progress ? `${progress.percent}% (${formatMb(progress.transferred)} MB / ${formatMb(progress.total)} MB)` : 'In progress...'}
            </div>
            {progress && (
              <div className="w-32 bg-black/30 rounded-full h-2 overflow-hidden border border-white/20">
                <div
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {status === 'DOWNLOADED' && (
          <div>
            <span className="font-semibold">Update Ready:</span> Version{' '}
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-xs">
              v{updateInfo?.version}
            </span>{' '}
            has been downloaded and is ready to install!
          </div>
        )}

        {status === 'ERROR' && (
          <div className="text-amber-100">
            <span className="font-semibold text-white">Update Warning:</span>{' '}
            {typeof error === 'object' ? ((error as any)?.message || JSON.stringify(error)) : String(error || 'Unable to download update automatically.')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {status === 'DOWNLOADED' && (
          <button
            onClick={handleQuitAndInstall}
            className="bg-white text-amber-900 font-semibold px-3 py-1 rounded shadow hover:bg-amber-50 transition-colors text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart & Install Now
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          title="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
