import { safeStorage } from 'electron'

/**
 * Encrypts sensitive secrets at rest using Electron safeStorage (OS DPAPI / Keychain).
 * Prepends 'enc:' prefix to distinguish encrypted payloads from plaintext legacy data.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return ''
  // If already encrypted, return as is
  if (plaintext.startsWith('enc:')) return plaintext

  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const buffer = safeStorage.encryptString(plaintext)
      return `enc:${buffer.toString('base64')}`
    }
  } catch (err) {
    console.warn('[Security] safeStorage encryption unavailable, using fallback:', err)
  }
  return plaintext
}

/**
 * Decrypts sensitive secrets using Electron safeStorage.
 * Seamlessly returns unencrypted plaintext for legacy/fallback data.
 */
export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) return ''
  if (!ciphertext.startsWith('enc:')) return ciphertext

  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const buffer = Buffer.from(ciphertext.slice(4), 'base64')
      return safeStorage.decryptString(buffer)
    }
  } catch (err) {
    console.warn('[Security] Failed to decrypt secret with safeStorage:', err)
  }
  return ciphertext
}
