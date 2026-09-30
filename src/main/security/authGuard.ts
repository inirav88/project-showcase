import crypto from 'crypto'

export class PinRateLimiter {
  private failedAttempts = 0
  private lockedUntil = 0
  private readonly maxAttempts: number
  private readonly lockoutMs: number

  constructor(maxAttempts = 5, lockoutMs = 30000) {
    this.maxAttempts = maxAttempts
    this.lockoutMs = lockoutMs
  }

  isLocked(): { locked: boolean; remainingSec: number } {
    const now = Date.now()
    if (now < this.lockedUntil) {
      return {
        locked: true,
        remainingSec: Math.ceil((this.lockedUntil - now) / 1000),
      }
    }
    return { locked: false, remainingSec: 0 }
  }

  recordFailure(): { locked: boolean; remainingSec: number } {
    this.failedAttempts += 1
    if (this.failedAttempts >= this.maxAttempts) {
      this.lockedUntil = Date.now() + this.lockoutMs
      this.failedAttempts = 0
      return {
        locked: true,
        remainingSec: Math.ceil(this.lockoutMs / 1000),
      }
    }
    return { locked: false, remainingSec: 0 }
  }

  recordSuccess(): void {
    this.failedAttempts = 0
    this.lockedUntil = 0
  }
}

/**
 * Constant-time hash verification to mitigate timing attacks (CWE-208)
 */
export function timingSafeHashVerify(plaintext: string, expectedHash: string): boolean {
  try {
    const computedHash = crypto.createHash('sha256').update(plaintext).digest('hex')
    const bufA = Buffer.from(computedHash, 'hex')
    const bufB = Buffer.from(expectedHash, 'hex')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Generates SHA-256 PIN hash
 */
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex')
}
