import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() },
}))

import { WhatsappHandlers } from '../whatsapp'

describe('WhatsappHandlers', () => {
  let mockDb: any
  let handlers: WhatsappHandlers

  beforeEach(() => {
    mockDb = {
      settings: {
        findUnique: vi.fn(),
      },
    }
    handlers = new WhatsappHandlers(mockDb)
  })

  it('formats 10-digit Indian phone numbers to E.164 format with 91 prefix', () => {
    expect(handlers.formatPhoneNumber('9876543210')).toBe('919876543210')
    expect(handlers.formatPhoneNumber('+91 98765 43210')).toBe('919876543210')
  })

  it('returns error if WhatsApp API credentials are missing in Admin Settings', async () => {
    mockDb.settings.findUnique.mockResolvedValueOnce({
      whatsappAllowApiSend: true,
      whatsappApiToken: '',
      whatsappApiPhoneNumberId: '',
    })

    const res = await handlers.sendApi({
      phone: '+91 (98765) 43210',
      clientName: 'Nirav',
      projectName: 'Avyanna',
      brochureUrl: 'https://example.com/brochure.pdf',
    })

    expect(res.success).toBe(false)
    expect(res.reason).toContain('API credentials missing')
  })
})
