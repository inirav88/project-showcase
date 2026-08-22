import { useEffect, useRef, useState } from 'react'
import { toMediaUrl } from '../utils/media'

/**
 * Hook that manages a looping ambient audio track for a project showcase.
 * Audio starts at low volume and can be muted/unmuted by the user.
 */
export function useAmbientAudio(mediaFilePath?: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mediaFilePath) return

    const audio = new Audio(toMediaUrl(mediaFilePath))
    audio.loop = true
    audio.volume = 0.25
    audioRef.current = audio

    audio.addEventListener('canplaythrough', () => setReady(true))
    audio.play().catch(() => {
      // Autoplay may be blocked — ignore silently
    })

    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
      setReady(false)
    }
  }, [mediaFilePath])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted
    }
  }, [muted])

  const toggleMute = () => setMuted((m) => !m)

  return { muted, toggleMute, hasAudio: !!mediaFilePath, ready }
}
