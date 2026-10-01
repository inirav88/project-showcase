import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockEncryptionAvailable = true

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => mockEncryptionAvailable,
    encryptString: (str: string) => Buffer.from(`mock_enc_${str}`),
    decryptString: (buf: Buffer) => buf.toString().replace(/^mock_enc_/, ''),
  },
}))

import { encryptSecret, decryptSecret } from '../cryptoStorage'

describe('cryptoStorage safeStorage Credential Encryption', () => {
  beforeEach(() => {
    mockEncryptionAvailable = true
  })

  it('encrypts plaintext secrets with enc: prefix and decrypts them back', () => {
    const rawSecret = 'EAABwzLIX_whatsapp_token_12345'
    const encrypted = encryptSecret(rawSecret)

    expect(encrypted.startsWith('enc:')).toBe(true)
    expect(encrypted).not.toBe(rawSecret)

    const decrypted = decryptSecret(encrypted)
    expect(decrypted).toBe(rawSecret)
  })

  it('returns plaintext if encryption is unavailable or secret is unencrypted legacy', () => {
    const legacySecret = 'legacy_plaintext_key'
    expect(decryptSecret(legacySecret)).toBe(legacySecret)

    mockEncryptionAvailable = false
    expect(encryptSecret('new_key')).toBe('new_key')
  })

  it('handles empty or undefined inputs gracefully', () => {
    expect(encryptSecret('')).toBe('')
    expect(decryptSecret('')).toBe('')
  })
})
